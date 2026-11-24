import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private employeeRepository: Repository<Employee>,
  ) {}

  async findAll(organizationId: string, filters: any = {}) {
    const query = this.employeeRepository
      .createQueryBuilder('emp')
      .where('emp.organizationId = :organizationId', { organizationId });

    if (filters.search) {
      query.andWhere('(emp.name ILIKE :s OR emp.employeeCode ILIKE :s OR emp.phone ILIKE :s)', { s: `%${filters.search}%` });
    }
    if (filters.department) query.andWhere('emp.department = :department', { department: filters.department });
    if (filters.branchId) query.andWhere('emp.branchId = :branchId', { branchId: filters.branchId });
    if (filters.activeOnly !== 'false') query.andWhere('emp.isActive = true');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    query.orderBy('emp.name', 'ASC').skip((page - 1) * limit).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, organizationId: string) {
    const emp = await this.employeeRepository.findOne({ where: { id, organizationId } });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async create(dto: any, userId: string, organizationId: string) {
    const count = await this.employeeRepository.count({ where: { organizationId } });
    const employeeCode = `EMP${String(count + 1001).padStart(5, '0')}`;

    const emp = this.employeeRepository.create({
      ...dto,
      employeeCode,
      organizationId,
      dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : undefined,
      createdBy: userId,
    });
    return this.employeeRepository.save(emp);
  }

  async update(id: string, dto: any, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.employeeRepository.update(id, { ...dto, updatedBy: userId });
    return this.findOne(id, organizationId);
  }

  async deactivate(id: string, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.employeeRepository.update(id, { isActive: false, updatedBy: userId });
    return { message: 'Employee deactivated' };
  }

  async getStats(organizationId: string) {
    const [total, active] = await Promise.all([
      this.employeeRepository.count({ where: { organizationId } }),
      this.employeeRepository.count({ where: { organizationId, isActive: true } }),
    ]);

    const salaryResult = await this.employeeRepository
      .createQueryBuilder('emp')
      .select('SUM(emp.salary)', 'totalPayroll')
      .where('emp.organizationId = :organizationId AND emp.isActive = true', { organizationId })
      .getRawOne();

    const byDept = await this.employeeRepository
      .createQueryBuilder('emp')
      .select('emp.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .where('emp.organizationId = :organizationId AND emp.isActive = true', { organizationId })
      .groupBy('emp.department')
      .getRawMany();

    return {
      totalEmployees: total,
      activeEmployees: active,
      monthlyPayroll: parseFloat(salaryResult.totalPayroll) || 0,
      byDepartment: byDept,
    };
  }
}
