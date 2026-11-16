import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch) private branchRepo: Repository<Branch>,
  ) {}

  async list(orgId: string) {
    return this.branchRepo.find({ where: { organizationId: orgId }, order: { createdAt: 'ASC' } });
  }

  async get(id: string, orgId: string) {
    const b = await this.branchRepo.findOne({ where: { id, organizationId: orgId } });
    if (!b) throw new NotFoundException('Branch not found');
    return b;
  }

  async create(orgId: string, data: any) {
    const branch = this.branchRepo.create({ ...data, organizationId: orgId });
    return this.branchRepo.save(branch);
  }

  async update(id: string, orgId: string, data: any) {
    await this.branchRepo.update({ id, organizationId: orgId }, data);
    return this.get(id, orgId);
  }

  async deactivate(id: string, orgId: string) {
    await this.branchRepo.update({ id, organizationId: orgId }, { isActive: false });
    return { success: true };
  }
}
