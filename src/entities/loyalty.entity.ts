import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Customer } from './customer.entity';

@Entity('membership_plans')
export class MembershipPlan extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'validity_days', default: 30 })
  validityDays: number;

  @Column({ name: 'points_multiplier', type: 'decimal', precision: 4, scale: 2, default: 1 })
  pointsMultiplier: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'free_pickups', default: 0 })
  freePickups: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'max_orders', nullable: true })
  maxOrders?: number;

  @Column({ type: 'jsonb', nullable: true })
  perks?: Record<string, any>;
}

@Entity('membership_subscriptions')
export class MembershipSubscription extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => MembershipPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: MembershipPlan;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'end_date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'amount_paid' })
  amountPaid: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'orders_used', default: 0 })
  ordersUsed: number;

  @Column({ name: 'pickups_used', default: 0 })
  pickupsUsed: number;
}

@Entity('loyalty_accounts')
export class LoyaltyAccount extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'points_balance', default: 0 })
  pointsBalance: number;

  @Column({ name: 'lifetime_points', default: 0 })
  lifetimePoints: number;

  @Column({ name: 'lifetime_redeemed', default: 0 })
  lifetimeRedeemed: number;

  @Column({ nullable: true })
  tier?: string;
}

@Entity('loyalty_transactions')
export class LoyaltyTransaction extends BaseEntity {
  @Index()
  @Column({ name: 'loyalty_account_id' })
  loyaltyAccountId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'enum', enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST'], default: 'EARN' })
  type: string;

  @Column()
  points: number;

  @Column({ nullable: true, name: 'order_id' })
  orderId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'balance_after' })
  balanceAfter: number;
}
