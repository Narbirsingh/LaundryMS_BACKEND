import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Branch } from './branch.entity';
import { Customer } from './customer.entity';
import { Order } from './order.entity';
import { PaymentMethod, PaymentStatus } from '../common/enums';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

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

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Index({ unique: true })
  @Column({ name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ name: 'invoice_date' })
  invoiceDate: Date;

  @Column({ name: 'due_date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'discount_amount' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cgst_amount' })
  cgstAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'sgst_amount' })
  sgstAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'igst_amount' })
  igstAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_tax' })
  totalTax: number;

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

  @Column({ nullable: true, name: 'notes' })
  notes?: string;

  @Column({ nullable: true, name: 'pdf_url' })
  pdfUrl?: string;

  @Column({ name: 'is_cancelled', default: false })
  isCancelled: boolean;

  @Column({ nullable: true, name: 'cancelled_reason' })
  cancelledReason?: string;
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Index()
  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'invoice_id', nullable: true })
  invoiceId?: string;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Index({ unique: true })
  @Column({ name: 'payment_reference' })
  paymentReference: string;

  @Column({ name: 'payment_date' })
  paymentDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true, name: 'transaction_id' })
  transactionId?: string;

  @Column({ nullable: true, name: 'gateway_reference' })
  gatewayReference?: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'received_by', nullable: true })
  receivedBy?: string;

  @Column({ name: 'is_advance', default: false })
  isAdvance: boolean;

  @Column({ name: 'is_refund', default: false })
  isRefund: boolean;

  @Column({ name: 'refund_reference', nullable: true })
  refundReference?: string;
}

@Entity('journal_entries')
export class JournalEntry extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @Column({ name: 'entry_date' })
  entryDate: Date;

  @Column({ name: 'entry_number' })
  entryNumber: string;

  @Column({ name: 'account_head' })
  accountHead: string;

  @Column({ name: 'account_code', nullable: true })
  accountCode?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  credit: number;

  @Column({ type: 'text', nullable: true })
  narration?: string;

  @Column({ nullable: true, name: 'reference_type' })
  referenceType?: string;

  @Column({ nullable: true, name: 'reference_id' })
  referenceId?: string;

  @Column({ name: 'is_posted', default: true })
  isPosted: boolean;

  @Column({ name: 'posted_by' })
  postedBy: string;
}
