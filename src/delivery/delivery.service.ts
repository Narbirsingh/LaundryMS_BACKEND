import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../common/enums';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async getRiderQueue(orgId: string) {
    const statuses = [
      OrderStatus.DELIVERY_ASSIGNED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERY_ASSIGNED,
    ];
    return this.orderRepo.find({
      where: { organizationId: orgId, status: In(statuses) as any },
      relations: { customer: true } as any,
      order: { expectedDelivery: 'ASC' },
    });
  }

  async getPickupQueue(orgId: string) {
    const statuses = [OrderStatus.PICKUP_SCHEDULED, OrderStatus.PICKUP_ASSIGNED];
    return this.orderRepo.find({
      where: { organizationId: orgId, status: In(statuses) as any },
      relations: { customer: true } as any,
      order: { orderDate: 'ASC' },
    });
  }

  async markDelivered(id: string, orgId: string, proof: any) {
    await this.orderRepo.update(
      { id, organizationId: orgId },
      { status: OrderStatus.DELIVERED, actualDelivery: new Date() },
    );
    return this.orderRepo.findOne({ where: { id } });
  }

  async markPickupDone(id: string, orgId: string) {
    await this.orderRepo.update(
      { id, organizationId: orgId },
      { status: OrderStatus.GARMENTS_COLLECTED },
    );
    return this.orderRepo.findOne({ where: { id } });
  }

  async getStats(orgId: string) {
    const pendingDeliveries = await this.orderRepo.count({
      where: { organizationId: orgId, status: OrderStatus.OUT_FOR_DELIVERY },
    });
    const pendingPickups = await this.orderRepo.count({
      where: { organizationId: orgId, status: OrderStatus.PICKUP_SCHEDULED },
    });
    const completedToday = await this.orderRepo
      .createQueryBuilder('o')
      .where('o.organizationId = :orgId AND o.status = :status AND DATE(o.actualDelivery) = CURRENT_DATE', {
        orgId,
        status: OrderStatus.DELIVERED,
      })
      .getCount();
    return { pendingDeliveries, pendingPickups, completedToday };
  }
}
