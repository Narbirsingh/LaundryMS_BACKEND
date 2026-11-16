import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { Branch } from './branch.entity';

@Entity('vendors')
export class Vendor extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ nullable: true, name: 'contact_person' })
  contactPerson?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  gstin?: string;

  @Column({ nullable: true })
  pan?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'outstanding_balance' })
  outstandingBalance: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

@Entity('inventory_items')
export class InventoryItem extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  unit?: string;

  @Column({ nullable: true })
  sku?: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'current_stock' })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'minimum_stock' })
  minimumStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'reorder_level' })
  reorderLevel?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost' })
  unitCost: number;

  @Column({ nullable: true, name: 'vendor_id' })
  vendorId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'track_expiry', default: false })
  trackExpiry: boolean;

  @Column({ nullable: true, name: 'expiry_date' })
  expiryDate?: Date;

  @Column({ nullable: true, name: 'batch_number' })
  batchNumber?: string;
}

@Entity('inventory_transactions')
export class InventoryTransaction extends BaseEntity {
  @Column({ name: 'inventory_item_id' })
  inventoryItemId: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'transaction_type' })
  transactionType: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'stock_before' })
  stockBefore: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'stock_after' })
  stockAfter: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'unit_cost' })
  unitCost?: number;

  @Column({ nullable: true, name: 'reference_id' })
  referenceId?: string;

  @Column({ nullable: true, name: 'reference_type' })
  referenceType?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'performed_by' })
  performedBy: string;
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Index({ unique: true })
  @Column({ name: 'po_number' })
  poNumber: string;

  @Column({ name: 'order_date' })
  orderDate: Date;

  @Column({ name: 'expected_delivery', nullable: true })
  expectedDelivery?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_amount' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ nullable: true })
  status?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
