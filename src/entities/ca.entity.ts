import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { TaxpayerType, ITRStatus, DocumentType } from '../common/enums';

@Entity('ca_clients')
export class CaClient extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ name: 'client_code', unique: true })
  clientCode: string;

  @Column({ name: 'legal_name' })
  legalName: string;

  @Column({
    type: 'enum',
    enum: TaxpayerType,
    name: 'taxpayer_type',
  })
  taxpayerType: TaxpayerType;

  @Index()
  @Column({ name: 'pan', unique: true })
  pan: string;

  @Column({ name: 'pan_masked', nullable: true })
  panMasked?: string;

  @Column({ name: 'date_of_birth', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  pincode?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true, name: 'residential_status' })
  residentialStatus?: string;

  @Column({ nullable: true })
  gstin?: string;

  @Column({ nullable: true, name: 'business_activity' })
  businessActivity?: string;

  @Column({ nullable: true, name: 'assigned_ca_id' })
  assignedCaId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'bank_accounts' })
  bankAccounts?: Record<string, any>[];

  @Column({ nullable: true, name: 'tax_regime' })
  taxRegime?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

@Entity('itr_records')
export class ItrRecord extends BaseEntity {
  @Index()
  @Column({ name: 'ca_client_id' })
  caClientId: string;

  @ManyToOne(() => CaClient)
  @JoinColumn({ name: 'ca_client_id' })
  caClient: CaClient;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'assessment_year' })
  assessmentYear: string;

  @Column({ name: 'financial_year' })
  financialYear: string;

  @Column({ nullable: true, name: 'itr_form' })
  itrForm?: string;

  @Column({
    type: 'enum',
    enum: ITRStatus,
    default: ITRStatus.DOCUMENT_COLLECTION,
  })
  status: ITRStatus;

  @Column({ nullable: true, name: 'assigned_to' })
  assignedTo?: string;

  @Column({ nullable: true, name: 'assigned_ca' })
  assignedCa?: string;

  @Column({ nullable: true, name: 'tax_regime' })
  taxRegime?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'gross_total_income' })
  grossTotalIncome?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'total_deductions' })
  totalDeductions?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'taxable_income' })
  taxableIncome?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'tax_liability' })
  taxLiability?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'tds_amount' })
  tdsAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'advance_tax_paid' })
  advanceTaxPaid?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'self_assessment_tax' })
  selfAssessmentTax?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'tax_refund' })
  taxRefund?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'tax_payable' })
  taxPayable?: number;

  @Column({ nullable: true, name: 'filing_date' })
  filingDate?: Date;

  @Column({ nullable: true, name: 'acknowledgement_number' })
  acknowledgementNumber?: string;

  @Column({ nullable: true, name: 'e_verification_status' })
  eVerificationStatus?: string;

  @Column({ nullable: true, name: 'e_verified_at' })
  eVerifiedAt?: Date;

  @Column({ type: 'jsonb', nullable: true, name: 'readiness_report' })
  readinessReport?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'tax_computation' })
  taxComputation?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true, name: 'ca_reviewed_at' })
  caReviewedAt?: Date;

  @Column({ nullable: true, name: 'client_approved_at' })
  clientApprovedAt?: Date;
}

@Entity('client_documents')
export class ClientDocument extends BaseEntity {
  @Index()
  @Column({ name: 'ca_client_id' })
  caClientId: string;

  @ManyToOne(() => CaClient)
  @JoinColumn({ name: 'ca_client_id' })
  caClient: CaClient;

  @Column({ name: 'itr_record_id', nullable: true })
  itrRecordId?: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({ name: 'document_name' })
  documentName: string;

  @Column({ name: 'assessment_year', nullable: true })
  assessmentYear?: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize?: number;

  @Column({ name: 'file_type', nullable: true })
  fileType?: string;

  @Column({ nullable: true, name: 'ocr_extracted_data', type: 'jsonb' })
  ocrExtractedData?: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'ocr_confidence' })
  ocrConfidence?: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ nullable: true, name: 'verified_by' })
  verifiedBy?: string;

  @Column({ nullable: true, name: 'verified_at' })
  verifiedAt?: Date;

  @Column({ nullable: true, name: 'approval_status' })
  approvalStatus?: string;

  @Column({ name: 'version', default: 1 })
  version: number;

  @Column({ nullable: true, name: 'previous_version_id' })
  previousVersionId?: string;
}

@Entity('reconciliation_records')
export class ReconciliationRecord extends BaseEntity {
  @Column({ name: 'itr_record_id' })
  itrRecordId: string;

  @ManyToOne(() => ItrRecord)
  @JoinColumn({ name: 'itr_record_id' })
  itrRecord: ItrRecord;

  @Column({ name: 'ca_client_id' })
  caClientId: string;

  @Column({ name: 'reconciliation_type' })
  reconciliationType: string;

  @Column({ name: 'source_a' })
  sourceA: string;

  @Column({ name: 'source_b' })
  sourceB: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_a' })
  amountA: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_b' })
  amountB: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'difference' })
  difference: number;

  @Column({ nullable: true })
  status?: string;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ nullable: true, name: 'assigned_reviewer' })
  assignedReviewer?: string;

  @Column({ nullable: true, name: 'resolved_at' })
  resolvedAt?: Date;
}
