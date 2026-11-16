import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { ServiceCategory, PricingMethod } from '../common/enums';

@Entity('services')
export class Service extends BaseEntity {
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

  @Column({
    type: 'enum',
    enum: ServiceCategory,
  })
  category: ServiceCategory;

  @Column({
    type: 'enum',
    enum: PricingMethod,
    name: 'pricing_method',
  })
  pricingMethod: PricingMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'express_price' })
  expressPrice?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'minimum_charge' })
  minimumCharge?: number;

  @Column({ name: 'gst_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  gstRate: number;

  @Column({ name: 'processing_hours', default: 24 })
  processingHours: number;

  @Column({ name: 'express_hours', nullable: true })
  expressHours?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ nullable: true, name: 'icon_url' })
  iconUrl?: string;
}

@Entity('service_price_lists')
export class ServicePriceList extends BaseEntity {
  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @Column({ name: 'customer_id', nullable: true })
  customerId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', nullable: true })
  effectiveTo?: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
