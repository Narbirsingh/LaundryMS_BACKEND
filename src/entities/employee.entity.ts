import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Branch } from './branch.entity';
import { ExpenseCategory } from '../common/enums';

@Entity('employees')
export class Employee extends BaseEntity {
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

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Index({ unique: true })
  @Column({ name: 'employee_code' })
  employeeCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  designation?: string;

  @Column({ name: 'date_of_joining', nullable: true })
  dateOfJoining?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  salary: number;

  @Column({ nullable: true })
  shift?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true, name: 'emergency_contact' })
  emergencyContact?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  pan?: string;

  @Column({ nullable: true, name: 'bank_account' })
  bankAccount?: string;

  @Column({ nullable: true, name: 'bank_name' })
  bankName?: string;

  @Column({ nullable: true })
  ifsc?: string;
}

@Entity('expenses')
export class Expense extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column()
  description: string;

  @Column({ name: 'expense_date' })
  expenseDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ nullable: true, name: 'vendor_id' })
  vendorId?: string;

  @Column({ nullable: true, name: 'vendor_name' })
  vendorName?: string;

  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod?: string;

  @Column({ nullable: true, name: 'payment_reference' })
  paymentReference?: string;

  @Column({ nullable: true, name: 'bill_number' })
  billNumber?: string;

  @Column({ nullable: true, name: 'bill_date' })
  billDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[];

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy?: string;

  @Column({ nullable: true, name: 'approval_status' })
  approvalStatus?: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ nullable: true, name: 'recurring_interval' })
  recurringInterval?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
