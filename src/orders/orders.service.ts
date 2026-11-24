import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Between, Like, ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderItem, OrderStatusHistory } from '../entities/order.entity';
import { Garment } from '../entities/garment.entity';
import { Customer } from '../entities/customer.entity';
import { Organization } from '../entities/organization.entity';
import { OrderStatus, GarmentStatus, PaymentStatus } from '../common/enums';
import {
  CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto,
} from './dto/order.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.ENQUIRY]: [OrderStatus.ORDER_CREATED, OrderStatus.CANCELLED],
  [OrderStatus.ORDER_CREATED]: [OrderStatus.PICKUP_SCHEDULED, OrderStatus.RECEIVED_AT_FACILITY, OrderStatus.CANCELLED],
  [OrderStatus.PICKUP_SCHEDULED]: [OrderStatus.PICKUP_ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.PICKUP_ASSIGNED]: [OrderStatus.GARMENTS_COLLECTED, OrderStatus.CANCELLED],
  [OrderStatus.GARMENTS_COLLECTED]: [OrderStatus.RECEIVED_AT_FACILITY],
  [OrderStatus.RECEIVED_AT_FACILITY]: [OrderStatus.GARMENT_INSPECTION],
  [OrderStatus.GARMENT_INSPECTION]: [OrderStatus.WEIGHT_VERIFICATION, OrderStatus.CANCELLED],
  [OrderStatus.WEIGHT_VERIFICATION]: [OrderStatus.STAIN_IDENTIFICATION],
  [OrderStatus.STAIN_IDENTIFICATION]: [OrderStatus.AWAITING_CUSTOMER_APPROVAL, OrderStatus.ORDER_CONFIRMED],
  [OrderStatus.AWAITING_CUSTOMER_APPROVAL]: [OrderStatus.ORDER_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.ORDER_CONFIRMED]: [OrderStatus.GARMENT_TAGGING],
  [OrderStatus.GARMENT_TAGGING]: [OrderStatus.SORTING],
  [OrderStatus.SORTING]: [OrderStatus.WASHING_QUEUE],
  [OrderStatus.WASHING_QUEUE]: [OrderStatus.WASHING_IN_PROGRESS],
  [OrderStatus.WASHING_IN_PROGRESS]: [OrderStatus.DRYING_IN_PROGRESS],
  [OrderStatus.DRYING_IN_PROGRESS]: [OrderStatus.IRONING, OrderStatus.DRY_CLEANING],
  [OrderStatus.IRONING]: [OrderStatus.QUALITY_INSPECTION],
  [OrderStatus.DRY_CLEANING]: [OrderStatus.QUALITY_INSPECTION],
  [OrderStatus.QUALITY_INSPECTION]: [OrderStatus.REPROCESSING, OrderStatus.FOLDING_PACKING],
  [OrderStatus.REPROCESSING]: [OrderStatus.QUALITY_INSPECTION],
  [OrderStatus.FOLDING_PACKING]: [OrderStatus.READY_FOR_DISPATCH],
  [OrderStatus.READY_FOR_DISPATCH]: [OrderStatus.DELIVERY_ASSIGNED, OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.DELIVERY_ASSIGNED]: [OrderStatus.OUT_FOR_DELIVERY],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.PARTIALLY_DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.PAYMENT_COMPLETED],
  [OrderStatus.PARTIALLY_DELIVERED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED, OrderStatus.PAYMENT_COMPLETED],
  [OrderStatus.PAYMENT_COMPLETED]: [OrderStatus.ORDER_CLOSED],
  [OrderStatus.ORDER_CLOSED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.DISPUTED]: [OrderStatus.ORDER_CLOSED, OrderStatus.CANCELLED],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Garment)
    private garmentRepository: Repository<Garment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto, userId: string, organizationId: string, branchId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId, organizationId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const org = await this.orgRepository.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderNumber = await this.generateOrderNumber(org, queryRunner.manager);

      let subtotal = 0;
      let taxAmount = 0;

      for (const item of dto.items) {
        const qty = item.quantity;
        const price = item.unitPrice;
        const discount = item.discountAmount || 0;
        const gstRate = item.gstRate || 0;
        const lineTotal = (qty * price) - discount;
        const lineTax = lineTotal * (gstRate / 100);
        subtotal += lineTotal;
        taxAmount += lineTax;
      }

      const discountAmount = dto.discountAmount || 0;
      const discountPercent = dto.discountPercent || 0;
      const finalDiscount = discountAmount || (subtotal * discountPercent / 100);
      const expressCharge = dto.isExpress ? subtotal * 0.5 : 0;
      const deliveryCharge = dto.isDelivery ? 50 : 0;
      const totalAmount = subtotal - finalDiscount + taxAmount + expressCharge + deliveryCharge;

      const order = queryRunner.manager.create(Order, {
        organizationId,
        branchId,
        customerId: dto.customerId,
        orderNumber,
        qrCode: `ORD-${uuidv4()}`,
        status: OrderStatus.ORDER_CREATED,
        orderDate: new Date(),
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
        isExpress: dto.isExpress,
        isPickup: dto.isPickup,
        isDelivery: dto.isDelivery,
        pickupAddress: dto.pickupAddress,
        deliveryAddress: dto.deliveryAddress,
        subtotal,
        discountAmount: finalDiscount,
        discountPercent,
        taxAmount,
        expressCharge,
        deliveryCharge,
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        paymentStatus: PaymentStatus.PENDING,
        specialInstructions: dto.specialInstructions,
        couponCode: dto.couponCode,
        source: dto.source,
        garmentCount: dto.garments?.length || 0,
        createdBy: userId,
      });
      await queryRunner.manager.save(order);

      for (const itemDto of dto.items) {
        const lineTotal = (itemDto.quantity * itemDto.unitPrice) - (itemDto.discountAmount || 0);
        const gstRate = itemDto.gstRate || 0;
        const gstAmount = lineTotal * (gstRate / 100);
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: order.id,
          serviceId: itemDto.serviceId,
          serviceName: itemDto.serviceName,
          description: itemDto.description,
          quantity: itemDto.quantity,
          unit: itemDto.unit,
          unitPrice: itemDto.unitPrice,
          discountAmount: itemDto.discountAmount || 0,
          gstRate,
          gstAmount,
          totalPrice: lineTotal + gstAmount,
          isExpress: itemDto.isExpress,
          createdBy: userId,
        });
        await queryRunner.manager.save(orderItem);
      }

      if (dto.garments) {
        for (const garmentDto of dto.garments) {
          const tagId = `TAG-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          const garment = queryRunner.manager.create(Garment, {
            orderId: order.id,
            organizationId,
            branchId,
            tagId,
            qrCode: `GRM-${uuidv4()}`,
            name: garmentDto.name,
            category: garmentDto.category,
            brand: garmentDto.brand,
            color: garmentDto.color,
            quantity: garmentDto.quantity,
            conditionAtReceipt: garmentDto.conditionAtReceipt,
            existingDamage: garmentDto.existingDamage,
            stainDescription: garmentDto.stainDescription,
            customerInstructions: garmentDto.customerInstructions,
            serviceId: garmentDto.serviceId,
            serviceName: garmentDto.serviceName,
            status: GarmentStatus.RECEIVED,
            price: garmentDto.price,
            createdBy: userId,
          });
          await queryRunner.manager.save(garment);
        }
      }

      const history = queryRunner.manager.create(OrderStatusHistory, {
        orderId: order.id,
        newStatus: OrderStatus.ORDER_CREATED,
        changedBy: userId,
        changedAt: new Date(),
        remarks: 'Order created',
      });
      await queryRunner.manager.save(history);

      await queryRunner.manager.increment(Customer, { id: dto.customerId }, 'totalOrders', 1);
      await queryRunner.manager.increment(
        Organization,
        { id: organizationId },
        'orderCounter',
        1,
      );

      await queryRunner.commitTransaction();

      return this.findOne(order.id, organizationId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: OrderFilterDto, organizationId: string) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.branch', 'branch')
      .where('order.organizationId = :organizationId', { organizationId });

    if (filters.search) {
      query.andWhere(
        '(order.orderNumber ILIKE :search OR customer.name ILIKE :search OR customer.mobile ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters.customerId) {
      query.andWhere('order.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.branchId) {
      query.andWhere('order.branchId = :branchId', { branchId: filters.branchId });
    }

    if (filters.isExpress !== undefined) {
      query.andWhere('order.isExpress = :isExpress', { isExpress: filters.isExpress });
    }

    if (filters.fromDate) {
      query.andWhere('order.orderDate >= :fromDate', { fromDate: new Date(filters.fromDate) });
    }

    if (filters.toDate) {
      query.andWhere('order.orderDate <= :toDate', { toDate: new Date(filters.toDate) });
    }

    if (filters.delayed) {
      query
        .andWhere('order.expectedDelivery < :now', { now: new Date() })
        .andWhere('order.status NOT IN (:...finalStatuses)', {
          finalStatuses: [OrderStatus.ORDER_CLOSED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);
    query.orderBy('order.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, organizationId: string) {
    const order = await this.orderRepository.findOne({
      where: { id, organizationId },
      relations: { customer: true, branch: true } as any,
    });

    if (!order) throw new NotFoundException('Order not found');

    const [items, garments, history] = await Promise.all([
      this.orderItemRepository.find({ where: { orderId: id } }),
      this.garmentRepository.find({ where: { orderId: id } }),
      this.statusHistoryRepository.find({
        where: { orderId: id },
        order: { changedAt: 'DESC' },
      }),
    ]);

    return { ...order, items, garments, history };
  }

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    organizationId: string,
    branchId: string,
  ) {
    const order = await this.orderRepository.findOne({ where: { id, organizationId } });
    if (!order) throw new NotFoundException('Order not found');

    const allowedNext = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const previousStatus = order.status;
    await this.orderRepository.update(id, { status: dto.status, updatedBy: userId });

    const history = this.statusHistoryRepository.create({
      orderId: id,
      previousStatus,
      newStatus: dto.status,
      changedBy: userId,
      branchId,
      remarks: dto.remarks,
      attachments: dto.attachments,
      changedAt: new Date(),
    });
    await this.statusHistoryRepository.save(history);

    return this.findOne(id, organizationId);
  }

  async getStatusHistory(id: string, organizationId: string) {
    const order = await this.orderRepository.findOne({ where: { id, organizationId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.statusHistoryRepository.find({
      where: { orderId: id },
      order: { changedAt: 'DESC' },
    });
  }

  async getDashboardStats(organizationId: string, branchId?: string) {
    const baseWhere: any = { organizationId };
    if (branchId) baseWhere.branchId = branchId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalOrders,
      newOrdersToday,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      delayedOrders,
    ] = await Promise.all([
      this.orderRepository.count({ where: baseWhere }),
      this.orderRepository.count({
        where: { ...baseWhere, orderDate: Between(today, tomorrow) },
      }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.ORDER_CLOSED } }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.ORDER_CREATED } }),
      this.orderRepository.count({ where: { ...baseWhere, status: OrderStatus.CANCELLED } }),
      this.orderRepository
        .createQueryBuilder('order')
        .where('order.organizationId = :organizationId', { organizationId })
        .andWhere('order.expectedDelivery < :now', { now: new Date() })
        .andWhere('order.status NOT IN (:...finalStatuses)', {
          finalStatuses: [OrderStatus.ORDER_CLOSED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
        })
        .getCount(),
    ]);

    const salesResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalSales')
      .addSelect('SUM(order.amountPaid)', 'totalCollected')
      .addSelect('SUM(order.amountDue)', 'totalOutstanding')
      .where('order.organizationId = :organizationId', { organizationId })
      .getRawOne();

    return {
      totalOrders,
      newOrdersToday,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      delayedOrders,
      totalSales: parseFloat(salesResult.totalSales) || 0,
      totalCollected: parseFloat(salesResult.totalCollected) || 0,
      totalOutstanding: parseFloat(salesResult.totalOutstanding) || 0,
    };
  }

  private async generateOrderNumber(org: Organization, manager: any): Promise<string> {
    const counter = org.orderCounter || 1000;
    const year = new Date().getFullYear().toString().slice(-2);
    return `${org.orderPrefix}${year}${String(counter).padStart(5, '0')}`;
  }
}
