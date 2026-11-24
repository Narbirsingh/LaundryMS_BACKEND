import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from '../entities/employee.entity';
import { ExpenseCategory } from '../common/enums';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    const query = this.expenseRepository
      .createQueryBuilder('e')
      .where('e.organizationId = :organizationId', { organizationId })
      .orderBy('e.expenseDate', 'DESC');

    if (filters.category) query.andWhere('e.category = :category', { category: filters.category });
    if (filters.branchId) query.andWhere('e.branchId = :branchId', { branchId: filters.branchId });
    if (filters.approvalStatus) query.andWhere('e.approvalStatus = :approvalStatus', { approvalStatus: filters.approvalStatus });
    if (filters.fromDate) query.andWhere('e.expenseDate >= :fromDate', { fromDate: new Date(filters.fromDate) });
    if (filters.toDate) query.andWhere('e.expenseDate <= :toDate', { toDate: new Date(filters.toDate) });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, organizationId: string) {
    const expense = await this.expenseRepository.findOne({ where: { id, organizationId } });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(dto: any, userId: string, organizationId: string) {
    const expense = this.expenseRepository.create({
      ...dto,
      organizationId,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      approvalStatus: 'PENDING',
      createdBy: userId,
    });
    return this.expenseRepository.save(expense);
  }

  async update(id: string, dto: any, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.expenseRepository.update(id, { ...dto, updatedBy: userId });
    return this.findOne(id, organizationId);
  }

  async approve(id: string, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.expenseRepository.update(id, { approvalStatus: 'APPROVED', approvedBy: userId, updatedBy: userId });
    return this.findOne(id, organizationId);
  }

  async reject(id: string, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.expenseRepository.update(id, { approvalStatus: 'REJECTED', updatedBy: userId });
    return this.findOne(id, organizationId);
  }

  async getStats(organizationId: string) {
    const result = await this.expenseRepository
      .createQueryBuilder('e')
      .select('SUM(e.amount)', 'totalExpenses')
      .addSelect('COUNT(*)', 'totalCount')
      .where('e.organizationId = :organizationId', { organizationId })
      .getRawOne();

    const pending = await this.expenseRepository.count({
      where: { organizationId, approvalStatus: 'PENDING' },
    });

    const byCategoryRaw = await this.expenseRepository
      .createQueryBuilder('e')
      .select('e.category', 'category')
      .addSelect('SUM(e.amount)', 'total')
      .where('e.organizationId = :organizationId', { organizationId })
      .groupBy('e.category')
      .getRawMany();

    return {
      totalExpenses: parseFloat(result.totalExpenses) || 0,
      totalCount: parseInt(result.totalCount) || 0,
      pendingApproval: pending,
      byCategory: byCategoryRaw,
    };
  }
}
