import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Branch } from './branch.entity';
import { Customer } from './customer.entity';
import { OrderStatus, PaymentStatus, PaymentMethod } from '../common/enums';

@Entity('orders')
export class Order extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Index()
  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Index({ unique: true })
  @Column({ name: 'order_number' })
  orderNumber: string;

  @Column({ nullable: true, name: 'qr_code' })
  qrCode?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.ORDER_CREATED,
  })
  status: OrderStatus;

  @Column({ name: 'order_date' })
  orderDate: Date;

  @Column({ name: 'expected_delivery', nullable: true })
  expectedDelivery?: Date;

  @Column({ name: 'actual_delivery', nullable: true })
  actualDelivery?: Date;

  @Column({ name: 'is_express', default: false })
  isExpress: boolean;

  @Column({ name: 'is_pickup', default: false })
  isPickup: boolean;

  @Column({ name: 'is_delivery', default: false })
  isDelivery: boolean;

  @Column({ type: 'text', nullable: true, name: 'pickup_address' })
  pickupAddress?: string;

  @Column({ type: 'text', nullable: true, name: 'delivery_address' })
  deliveryAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'subtotal' })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'discount_percent' })
  discountPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'express_charge' })
  expressCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'delivery_charge' })
  deliveryCharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'amount_paid' })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'amount_due' })
  amountDue: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    name: 'payment_status',
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions?: string;

  @Column({ type: 'text', nullable: true, name: 'internal_notes' })
  internalNotes?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'photos' })
  photos?: string[];

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ name: 'garment_count', default: 0 })
  garmentCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'total_weight_kg' })
  totalWeightKg: number;

  @Column({ name: 'loyalty_points_earned', default: 0 })
  loyaltyPointsEarned: number;

  @Column({ name: 'loyalty_points_redeemed', default: 0 })
  loyaltyPointsRedeemed: number;

  @Column({ nullable: true, name: 'coupon_code' })
  couponCode?: string;

  @Column({ nullable: true, name: 'source' })
  source?: string;
}

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantity: number;

  @Column({ nullable: true })
  unit?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, name: 'gst_rate' })
  gstRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'gst_amount' })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ name: 'is_express', default: false })
  isExpress: boolean;
}

@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'previous_status',
    nullable: true,
  })
  previousStatus?: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    name: 'new_status',
  })
  newStatus: OrderStatus;

  @Column({ name: 'changed_by' })
  changedBy: string;

  @Column({ name: 'employee_name', nullable: true })
  employeeName?: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[];

  @Column({ name: 'changed_at' })
  changedAt: Date;
}
