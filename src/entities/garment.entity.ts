import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { GarmentStatus, QualityResult } from '../common/enums';

@Entity('garments')
export class Garment extends BaseEntity {
  @Index()
  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Index({ unique: true })
  @Column({ name: 'tag_id' })
  tagId: string;

  @Column({ nullable: true, name: 'qr_code' })
  qrCode?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ default: 1 })
  quantity: number;

  @Column({ nullable: true, name: 'condition_at_receipt' })
  conditionAtReceipt?: string;

  @Column({ nullable: true, name: 'existing_damage' })
  existingDamage?: string;

  @Column({ nullable: true, name: 'stain_description' })
  stainDescription?: string;

  @Column({ type: 'text', nullable: true, name: 'customer_instructions' })
  customerInstructions?: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'service_name' })
  serviceName: string;

  @Column({
    type: 'enum',
    enum: GarmentStatus,
    default: GarmentStatus.RECEIVED,
  })
  status: GarmentStatus;

  @Column({ name: 'batch_id', nullable: true })
  batchId?: string;

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'photos_before' })
  photosBefore?: string[];

  @Column({ type: 'jsonb', nullable: true, name: 'photos_after' })
  photosAfter?: string[];

  @Column({ nullable: true, name: 'processing_started_at' })
  processingStartedAt?: Date;

  @Column({ nullable: true, name: 'processing_completed_at' })
  processingCompletedAt?: Date;

  @Column({ nullable: true, name: 'quality_inspected_by' })
  qualityInspectedBy?: string;

  @Column({ nullable: true, name: 'quality_inspected_at' })
  qualityInspectedAt?: Date;

  @Column({
    type: 'enum',
    enum: QualityResult,
    nullable: true,
    name: 'quality_result',
  })
  qualityResult?: QualityResult;

  @Column({ type: 'text', nullable: true, name: 'quality_notes' })
  qualityNotes?: string;

  @Column({ name: 'rework_count', default: 0 })
  reworkCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price: number;

  @Column({ name: 'is_delivered', default: false })
  isDelivered: boolean;
}

@Entity('processing_batches')
export class ProcessingBatch extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @Index({ unique: true })
  @Column({ name: 'batch_number' })
  batchNumber: string;

  @Column({ nullable: true, name: 'qr_code' })
  qrCode?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true, name: 'machine_id' })
  machineId?: string;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true, name: 'started_at' })
  startedAt?: Date;

  @Column({ nullable: true, name: 'completed_at' })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'garment_count', default: 0 })
  garmentCount: number;
}

@Entity('quality_inspections')
export class QualityInspection extends BaseEntity {
  @Column({ name: 'garment_id' })
  garmentId: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'inspector_id' })
  inspectorId: string;

  @Column({ type: 'jsonb', name: 'checklist_results' })
  checklistResults: Record<string, boolean>;

  @Column({
    type: 'enum',
    enum: QualityResult,
  })
  result: QualityResult;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  photos?: string[];

  @Column({ name: 'inspected_at' })
  inspectedAt: Date;
}
