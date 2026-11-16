import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponUsage } from '../entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon) private couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage) private usageRepo: Repository<CouponUsage>,
  ) {}

  async list(orgId: string) {
    return this.couponRepo.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
  }

  async validate(code: string, orgId: string, customerId: string, orderValue: number) {
    const coupon = await this.couponRepo.findOne({ where: { code, organizationId: orgId, isActive: true } });
    if (!coupon) throw new NotFoundException('Coupon not found or inactive');

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      throw new BadRequestException('Coupon is expired');
    }
    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (orderValue < Number(coupon.minOrderValue)) {
      throw new BadRequestException(`Minimum order value is ₹${coupon.minOrderValue}`);
    }

    const customerUsage = await this.usageRepo.count({ where: { couponId: coupon.id, customerId } });
    if (customerUsage >= coupon.usagePerCustomer) {
      throw new BadRequestException('You have already used this coupon');
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderValue * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
    } else if (coupon.type === 'FLAT') {
      discount = Number(coupon.value);
    }

    return { valid: true, coupon, discount };
  }

  async apply(couponId: string, orgId: string, customerId: string, orderId: string, discountAmount: number) {
    await this.couponRepo.increment({ id: couponId }, 'timesUsed', 1);
    return this.usageRepo.save(this.usageRepo.create({ couponId, customerId, orderId, discountAmount, organizationId: orgId }));
  }

  async create(orgId: string, data: any) {
    const code = data.code?.toUpperCase() || `OFF${Date.now().toString(36).toUpperCase()}`;
    return this.couponRepo.save(this.couponRepo.create({ ...data, code, organizationId: orgId }));
  }

  async update(id: string, orgId: string, data: any) {
    await this.couponRepo.update({ id, organizationId: orgId }, data);
    return this.couponRepo.findOne({ where: { id } });
  }

  async deactivate(id: string, orgId: string) {
    await this.couponRepo.update({ id, organizationId: orgId }, { isActive: false });
    return { success: true };
  }

  async getStats(orgId: string) {
    const total = await this.couponRepo.count({ where: { organizationId: orgId } });
    const active = await this.couponRepo.count({ where: { organizationId: orgId, isActive: true } });
    const totalUsages = await this.usageRepo.count({ where: { organizationId: orgId } });
    const totalDiscount = await this.usageRepo
      .createQueryBuilder('u')
      .select('SUM(u.discountAmount)', 'total')
      .where('u.organizationId = :orgId', { orgId })
      .getRawOne();
    return { total, active, totalUsages, totalDiscount: totalDiscount?.total || 0 };
  }
}
