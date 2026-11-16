import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, Payment, JournalEntry } from '../entities/billing.entity';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';
import { PaymentStatus, PaymentMethod } from '../common/enums';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(JournalEntry) private journalRepository: Repository<JournalEntry>,
    @InjectRepository(Order) private orderRepository: Repository<Order>,
    @InjectRepository(Customer) private customerRepository: Repository<Customer>,
  ) {}

  async createInvoiceFromOrder(orderId: string, userId: string, organizationId: string, branchId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, organizationId },
      relations: { customer: true } as any,
    });
    if (!order) throw new NotFoundException('Order not found');

    const existing = await this.invoiceRepository.findOne({ where: { orderId, organizationId } });
    if (existing) return existing;

    const invoiceNumber = `INV-${Date.now()}`;
    const taxAmount = order.taxAmount || 0;
    const halfTax = taxAmount / 2;

    const invoice = this.invoiceRepository.create({
      organizationId,
      branchId,
      customerId: order.customerId,
      orderId,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalTax: taxAmount,
      totalAmount: order.totalAmount,
      amountPaid: order.amountPaid,
      amountDue: order.amountDue,
      paymentStatus: order.amountDue <= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
      createdBy: userId,
    });

    return this.invoiceRepository.save(invoice);
  }

  async findAllInvoices(organizationId: string, branchId?: string, customerId?: string, page = 1, limit = 20) {
    const query = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.customer', 'customer')
      .where('inv.organizationId = :organizationId', { organizationId })
      .orderBy('inv.invoiceDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (branchId) query.andWhere('inv.branchId = :branchId', { branchId });
    if (customerId) query.andWhere('inv.customerId = :customerId', { customerId });

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneInvoice(id: string, organizationId: string) {
    const inv = await this.invoiceRepository.findOne({
      where: { id, organizationId },
      relations: { customer: true } as any,
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    const payments = await this.paymentRepository.find({ where: { invoiceId: id } });
    return { ...inv, payments };
  }

  async recordPayment(dto: any, userId: string, organizationId: string, branchId: string) {
    const paymentReference = `PAY-${Date.now()}`;

    const payment = this.paymentRepository.create({
      ...dto,
      paymentReference,
      organizationId,
      branchId,
      paymentDate: new Date(),
      status: PaymentStatus.PAID,
      receivedBy: userId,
      createdBy: userId,
    });
    await this.paymentRepository.save(payment);

    if (dto.invoiceId) {
      const inv = await this.invoiceRepository.findOne({ where: { id: dto.invoiceId, organizationId } });
      if (inv) {
        const newPaid = Number(inv.amountPaid) + Number(dto.amount);
        const newDue = Number(inv.totalAmount) - newPaid;
        await this.invoiceRepository.update(inv.id, {
          amountPaid: newPaid,
          amountDue: Math.max(0, newDue),
          paymentStatus: newDue <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL,
        });
      }
    }

    if (dto.customerId) {
      await this.customerRepository.increment({ id: dto.customerId }, 'totalSpent', Number(dto.amount));
    }

    return payment;
  }

  async findAllPayments(organizationId: string, customerId?: string, page = 1, limit = 20) {
    const query = this.paymentRepository
      .createQueryBuilder('p')
      .where('p.organizationId = :organizationId', { organizationId })
      .orderBy('p.paymentDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (customerId) query.andWhere('p.customerId = :customerId', { customerId });

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBillingStats(organizationId: string) {
    const result = await this.invoiceRepository
      .createQueryBuilder('inv')
      .select('SUM(inv.totalAmount)', 'totalBilled')
      .addSelect('SUM(inv.amountPaid)', 'totalCollected')
      .addSelect('SUM(inv.amountDue)', 'totalOutstanding')
      .addSelect('COUNT(*)', 'totalInvoices')
      .where('inv.organizationId = :organizationId AND inv.isCancelled = false', { organizationId })
      .getRawOne();

    const overdue = await this.invoiceRepository.count({
      where: { organizationId, paymentStatus: PaymentStatus.PENDING },
    });

    return {
      totalBilled: parseFloat(result.totalBilled) || 0,
      totalCollected: parseFloat(result.totalCollected) || 0,
      totalOutstanding: parseFloat(result.totalOutstanding) || 0,
      totalInvoices: parseInt(result.totalInvoices) || 0,
      overdueInvoices: overdue,
    };
  }
}
