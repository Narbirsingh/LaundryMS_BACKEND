import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
  FREE_PICKUP = 'FREE_PICKUP',
  FREE_SERVICE = 'FREE_SERVICE',
}

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Index({ unique: true })
  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: CouponType, default: CouponType.PERCENTAGE })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_order_value', default: 0 })
  minOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'max_discount' })
  maxDiscount?: number;

  @Column({ name: 'valid_from' })
  validFrom: Date;

  @Column({ name: 'valid_until' })
  validUntil: Date;

  @Column({ name: 'usage_limit', nullable: true })
  usageLimit?: number;

  @Column({ name: 'usage_per_customer', default: 1 })
  usagePerCustomer: number;

  @Column({ name: 'times_used', default: 0 })
  timesUsed: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'applicable_services', type: 'jsonb', nullable: true })
  applicableServices?: string[];

  @Column({ name: 'applicable_customer_types', type: 'jsonb', nullable: true })
  applicableCustomerTypes?: string[];
}

@Entity('coupon_usages')
export class CouponUsage extends BaseEntity {
  @Column({ name: 'coupon_id' })
  couponId: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discountAmount: number;

  @Column({ name: 'organization_id' })
  organizationId: string;
}
