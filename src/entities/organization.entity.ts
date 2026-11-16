import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationStatus, SubscriptionPlan } from '../common/enums';

@Entity('organizations')
export class Organization extends BaseEntity {
  @Column({ name: 'business_name' })
  businessName: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  pincode?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Index()
  @Column({ nullable: true, name: 'gstin' })
  gstin?: string;

  @Column({ nullable: true })
  pan?: string;

  @Column({ nullable: true })
  tan?: string;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber?: string;

  @Column({ name: 'business_type', nullable: true })
  businessType?: string;

  @Column({ default: 'INR' })
  currency: string;

  @Column({ default: 'Asia/Kolkata' })
  timezone: string;

  @Column({ name: 'financial_year_start', default: 4 })
  financialYearStart: number;

  @Column({ name: 'invoice_prefix', default: 'INV' })
  invoicePrefix: string;

  @Column({ name: 'invoice_counter', default: 1000 })
  invoiceCounter: number;

  @Column({ name: 'order_prefix', default: 'ORD' })
  orderPrefix: string;

  @Column({ name: 'order_counter', default: 1000 })
  orderCounter: number;

  @Column({ name: 'owner_name', nullable: true })
  ownerName?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: OrganizationStatus, default: OrganizationStatus.PENDING })
  status: OrganizationStatus;

  @Column({ name: 'subscription_plan', type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.FREE })
  subscriptionPlan: SubscriptionPlan;

  @Column({ name: 'commission_percentage', type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionPercentage: number;

  @Column({ name: 'alternate_phone', nullable: true })
  alternatePhone?: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ name: 'pickup_delivery_available', default: false })
  pickupDeliveryAvailable: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'service_areas' })
  serviceAreas?: string[];

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejectionReason?: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'suspended_at', type: 'timestamp', nullable: true })
  suspendedAt?: Date;

  @Column({ name: 'blocked_at', type: 'timestamp', nullable: true })
  blockedAt?: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp', nullable: true })
  deactivatedAt?: Date;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'business_hours' })
  businessHours?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'tax_config' })
  taxConfig?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'notification_config' })
  notificationConfig?: Record<string, any>;
}
