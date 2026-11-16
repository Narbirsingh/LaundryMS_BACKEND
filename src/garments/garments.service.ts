import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Garment, ProcessingBatch, QualityInspection } from '../entities/garment.entity';
import { GarmentStatus, QualityResult } from '../common/enums';

@Injectable()
export class GarmentsService {
  constructor(
    @InjectRepository(Garment) private garmentRepo: Repository<Garment>,
    @InjectRepository(ProcessingBatch) private batchRepo: Repository<ProcessingBatch>,
    @InjectRepository(QualityInspection) private qualityRepo: Repository<QualityInspection>,
  ) {}

  async listByOrder(orderId: string, orgId: string) {
    return this.garmentRepo.find({ where: { orderId, organizationId: orgId } });
  }

  async findByTag(tagId: string, orgId: string) {
    const g = await this.garmentRepo.findOne({ where: { tagId, organizationId: orgId } });
    if (!g) throw new NotFoundException(`Garment tag ${tagId} not found`);
    return g;
  }

  async list(orgId: string, params: any) {
    const qb = this.garmentRepo.createQueryBuilder('g')
      .where('g.organizationId = :orgId', { orgId });
    if (params?.status) qb.andWhere('g.status = :status', { status: params.status });
    if (params?.orderId) qb.andWhere('g.orderId = :orderId', { orderId: params.orderId });
    return qb.orderBy('g.createdAt', 'DESC').take(params?.limit || 100).getMany();
  }

  async create(orgId: string, branchId: string, data: any) {
    const tagId = `TAG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const garment = this.garmentRepo.create({ ...data, organizationId: orgId, branchId, tagId });
    return this.garmentRepo.save(garment);
  }

  async updateStatus(id: string, orgId: string, status: GarmentStatus) {
    await this.garmentRepo.update({ id, organizationId: orgId }, { status });
    return this.garmentRepo.findOne({ where: { id } });
  }

  async recordQuality(garmentId: string, orgId: string, data: any) {
    const inspection = this.qualityRepo.create({
      garmentId,
      orderId: data.orderId,
      inspectorId: data.inspectorId,
      checklistResults: data.checklistResults,
      result: data.result as QualityResult,
      notes: data.notes,
      inspectedAt: new Date(),
    });
    await this.qualityRepo.save(inspection);
    await this.garmentRepo.update(
      { id: garmentId, organizationId: orgId },
      {
        qualityResult: data.result,
        qualityNotes: data.notes,
        qualityInspectedAt: new Date(),
        status: data.result === 'PASS' ? GarmentStatus.QUALITY_PASSED : GarmentStatus.QUALITY_FAILED,
      },
    );
    return inspection;
  }

  async getStats(orgId: string) {
    const total = await this.garmentRepo.count({ where: { organizationId: orgId } });
    const statuses = await this.garmentRepo
      .createQueryBuilder('g')
      .select('g.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('g.organizationId = :orgId', { orgId })
      .groupBy('g.status')
      .getRawMany();
    return { total, byStatus: statuses };
  }

  async listBatches(orgId: string) {
    return this.batchRepo.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
  }

  async createBatch(orgId: string, branchId: string, data: any) {
    const batchNumber = `BATCH-${Date.now()}`;
    const batch = this.batchRepo.create({ ...data, organizationId: orgId, branchId, batchNumber });
    return this.batchRepo.save(batch);
  }
}
