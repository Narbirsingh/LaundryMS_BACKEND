import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Branch } from './branch.entity';
import { CustomerType } from '../common/enums';

@Entity('customers')
export class Customer extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;

  @Index()
  @Column({ name: 'customer_code', unique: true })
  customerCode: string;

  @Column()
  name: string;

  @Index()
  @Column()
  mobile: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  pincode?: string;

  @Column({ nullable: true, name: 'delivery_address' })
  deliveryAddress?: string;

  @Column({
    type: 'enum',
    enum: CustomerType,
    default: CustomerType.INDIVIDUAL,
  })
  type: CustomerType;

  @Column({ nullable: true })
  gstin?: string;

  @Column({ nullable: true, name: 'billing_name' })
  billingName?: string;

  @Column({ nullable: true, name: 'billing_address' })
  billingAddress?: string;

  @Column({ type: 'text', nullable: true })
  preferences?: string;

  @Column({ type: 'text', nullable: true, name: 'garment_instructions' })
  garmentInstructions?: string;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'wallet_balance' })
  walletBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'outstanding_balance' })
  outstandingBalance: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true, name: 'referred_by' })
  referredBy?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating?: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_spent' })
  totalSpent: number;
}
