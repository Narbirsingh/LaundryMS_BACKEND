import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServicePriceList } from '../entities/service.entity';
import { ServiceCategory, PricingMethod } from '../common/enums';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service) private serviceRepository: Repository<Service>,
    @InjectRepository(ServicePriceList) private priceListRepository: Repository<ServicePriceList>,
  ) {}

  async findAll(organizationId: string, category?: ServiceCategory, activeOnly = true) {
    const query = this.serviceRepository
      .createQueryBuilder('s')
      .where('s.organizationId = :organizationId', { organizationId })
      .orderBy('s.sortOrder', 'ASC')
      .addOrderBy('s.name', 'ASC');

    if (activeOnly) query.andWhere('s.isActive = true');
    if (category) query.andWhere('s.category = :category', { category });

    return query.getMany();
  }

  async findOne(id: string, organizationId: string) {
    const service = await this.serviceRepository.findOne({ where: { id, organizationId } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: any, userId: string, organizationId: string) {
    const service = this.serviceRepository.create({
      ...dto,
      organizationId,
      createdBy: userId,
    });
    return this.serviceRepository.save(service);
  }

  async update(id: string, dto: any, userId: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.serviceRepository.update(id, { ...dto, updatedBy: userId });
    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.serviceRepository.softDelete(id);
    return { message: 'Service deleted' };
  }

  async setPriceList(serviceId: string, dto: any, userId: string, organizationId: string) {
    await this.findOne(serviceId, organizationId);

    // Deactivate existing active price lists for same scope
    await this.priceListRepository.update(
      { serviceId, organizationId, branchId: dto.branchId, customerId: dto.customerId, isActive: true },
      { isActive: false },
    );

    const pl = this.priceListRepository.create({
      ...dto,
      serviceId,
      organizationId,
      isActive: true,
      createdBy: userId,
    });
    return this.priceListRepository.save(pl);
  }

  async getPriceLists(serviceId: string, organizationId: string) {
    return this.priceListRepository.find({
      where: { serviceId, organizationId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async getCategories() {
    return Object.values(ServiceCategory);
  }
}
