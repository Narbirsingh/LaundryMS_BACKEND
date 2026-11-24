import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaClient, ItrRecord, ClientDocument, ReconciliationRecord } from '../entities/ca.entity';
import { TaxpayerType, ITRStatus, DocumentType } from '../common/enums';

@Injectable()
export class CaService {
  constructor(
    @InjectRepository(CaClient) private caClientRepository: Repository<CaClient>,
    @InjectRepository(ItrRecord) private itrRecordRepository: Repository<ItrRecord>,
    @InjectRepository(ClientDocument) private documentRepository: Repository<ClientDocument>,
    @InjectRepository(ReconciliationRecord)
    private reconciliationRepository: Repository<ReconciliationRecord>,
  ) {}

  async createClient(dto: any, userId: string, organizationId: string) {
    const clientCode = await this.generateClientCode(organizationId);
    const panMasked = dto.pan
      ? `${dto.pan.substring(0, 2)}XXXXXXX${dto.pan.substring(9)}`
      : undefined;

    const client = this.caClientRepository.create({
      ...dto,
      clientCode,
      panMasked,
      organizationId,
      assignedCaId: userId,
      createdBy: userId,
    });

    return this.caClientRepository.save(client);
  }

  async findAllClients(organizationId: string, assignedCaId?: string, page = 1, limit = 20) {
    const query = this.caClientRepository
      .createQueryBuilder('client')
      .where('client.organizationId = :organizationId', { organizationId });

    if (assignedCaId) {
      query.andWhere('client.assignedCaId = :assignedCaId', { assignedCaId });
    }

    query.skip((page - 1) * limit).take(limit).orderBy('client.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((c) => ({ ...c, pan: c.panMasked || c.pan })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findClientById(id: string, organizationId: string, includeFullPan = false) {
    const client = await this.caClientRepository.findOne({ where: { id, organizationId } });
    if (!client) throw new NotFoundException('CA client not found');

    if (!includeFullPan) {
      client.pan = client.panMasked || client.pan;
    }

    return client;
  }

  async createItrRecord(clientId: string, dto: any, userId: string, organizationId: string) {
    const client = await this.findClientById(clientId, organizationId);

    const existing = await this.itrRecordRepository.findOne({
      where: { caClientId: clientId, assessmentYear: dto.assessmentYear },
    });
    if (existing) {
      throw new Error(`ITR record for AY ${dto.assessmentYear} already exists`);
    }

    const record = this.itrRecordRepository.create({
      ...dto,
      caClientId: clientId,
      organizationId,
      status: ITRStatus.DOCUMENT_COLLECTION,
      assignedTo: userId,
      createdBy: userId,
    });

    return this.itrRecordRepository.save(record);
  }

  async getItrRecord(itrId: string, organizationId: string) {
    const record = await this.itrRecordRepository.findOne({
      where: { id: itrId, organizationId },
      relations: { caClient: true } as any,
    });
    if (!record) throw new NotFoundException('ITR record not found');
    return record;
  }

  async updateItrStatus(itrId: string, status: ITRStatus, userId: string, organizationId: string, notes?: string) {
    const record = await this.getItrRecord(itrId, organizationId);

    const updateData: Partial<ItrRecord> = { status, updatedBy: userId };

    if (status === ITRStatus.CA_REVIEW) {
      updateData.caReviewedAt = new Date();
    } else if (status === ITRStatus.CLIENT_APPROVAL) {
      updateData.clientApprovedAt = new Date();
    }

    if (notes) updateData.notes = notes;

    await this.itrRecordRepository.update(itrId, updateData);
    return this.getItrRecord(itrId, organizationId);
  }

  async addDocument(itrId: string, dto: any, userId: string, organizationId: string) {
    const itr = await this.getItrRecord(itrId, organizationId);

    const doc = this.documentRepository.create({
      ...dto,
      caClientId: itr.caClientId,
      itrRecordId: itrId,
      organizationId,
      isVerified: false,
      version: 1,
      createdBy: userId,
    });

    return this.documentRepository.save(doc);
  }

  async getDocuments(caClientId: string, organizationId: string, assessmentYear?: string) {
    const query = this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.caClientId = :caClientId', { caClientId })
      .andWhere('doc.organizationId = :organizationId', { organizationId });

    if (assessmentYear) {
      query.andWhere('doc.assessmentYear = :assessmentYear', { assessmentYear });
    }

    return query.orderBy('doc.createdAt', 'DESC').getMany();
  }

  async verifyDocument(docId: string, userId: string, organizationId: string) {
    const doc = await this.documentRepository.findOne({
      where: { id: docId, organizationId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    await this.documentRepository.update(docId, {
      isVerified: true,
      verifiedBy: userId,
      verifiedAt: new Date(),
      approvalStatus: 'VERIFIED',
    });

    return this.documentRepository.findOne({ where: { id: docId } });
  }

  async checkItrReadiness(itrId: string, organizationId: string) {
    const itr = await this.getItrRecord(itrId, organizationId);
    const documents = await this.documentRepository.find({
      where: { itrRecordId: itrId, organizationId },
    });

    const verifiedDocs = documents.filter((d) => d.isVerified);
    const docTypes = documents.map((d) => d.documentType);

    const checks = [
      {
        check: 'PAN document collected',
        passed: docTypes.includes(DocumentType.PAN),
        required: true,
      },
      {
        check: 'Form 26AS / AIS available',
        passed: docTypes.includes(DocumentType.FORM_26AS) || docTypes.includes(DocumentType.AIS),
        required: true,
      },
      {
        check: 'Bank statement collected',
        passed: docTypes.includes(DocumentType.BANK_STATEMENT),
        required: false,
      },
      {
        check: 'Tax regime selected',
        passed: !!itr.taxRegime,
        required: true,
      },
      {
        check: 'All documents verified',
        passed: verifiedDocs.length === documents.length && documents.length > 0,
        required: false,
      },
      {
        check: 'Tax computation done',
        passed: !!itr.taxComputation,
        required: true,
      },
      {
        check: 'Gross total income computed',
        passed: itr.grossTotalIncome !== null && itr.grossTotalIncome !== undefined,
        required: true,
      },
      {
        check: 'No pending reconciliation',
        passed: await this.hasPendingReconciliation(itrId) === false,
        required: false,
      },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const failedRequired = checks.filter((c) => c.required && !c.passed);

    return {
      checks,
      passedCount,
      totalChecks: checks.length,
      requiredFailed: failedRequired,
      isReady: failedRequired.length === 0,
      readinessScore: Math.round((passedCount / checks.length) * 100),
    };
  }

  async addReconciliation(itrId: string, dto: any, userId: string, organizationId: string) {
    const record = this.reconciliationRepository.create({
      ...dto,
      itrRecordId: itrId,
      caClientId: dto.caClientId,
      organizationId,
      difference: dto.amountA - dto.amountB,
      status: 'PENDING',
      createdBy: userId,
    });
    return this.reconciliationRepository.save(record);
  }

  async getDashboard(organizationId: string, assignedCaId?: string) {
    const clientQuery = this.caClientRepository
      .createQueryBuilder('c')
      .where('c.organizationId = :organizationId', { organizationId });
    if (assignedCaId) clientQuery.andWhere('c.assignedCaId = :assignedCaId', { assignedCaId });

    const totalClients = await clientQuery.getCount();
    const activeClients = await clientQuery.andWhere('c.isActive = true').getCount();

    const itrQuery = this.itrRecordRepository
      .createQueryBuilder('itr')
      .where('itr.organizationId = :organizationId', { organizationId });

    const statusCounts = await itrQuery
      .select('itr.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('itr.status')
      .getRawMany();

    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusMap[s.status] = parseInt(s.count);
    });

    return {
      totalClients,
      activeClients,
      pendingDocumentation: statusMap[ITRStatus.DOCUMENT_COLLECTION] || 0,
      reconciliationPending: statusMap[ITRStatus.RECONCILIATION] || 0,
      itrPreparationPending: statusMap[ITRStatus.TAX_COMPUTATION] || 0,
      readyForCaReview: statusMap[ITRStatus.CA_REVIEW] || 0,
      readyForClientApproval: statusMap[ITRStatus.CLIENT_APPROVAL] || 0,
      filedReturns: statusMap[ITRStatus.FILED] || 0,
      pendingEVerification: statusMap[ITRStatus.ACKNOWLEDGEMENT_RECEIVED] || 0,
    };
  }

  private async hasPendingReconciliation(itrId: string): Promise<boolean> {
    const count = await this.reconciliationRepository.count({
      where: { itrRecordId: itrId, status: 'PENDING' },
    });
    return count > 0;
  }

  private async generateClientCode(organizationId: string): Promise<string> {
    const count = await this.caClientRepository.count({ where: { organizationId } });
    return `CA${String(count + 1001).padStart(5, '0')}`;
  }
}
