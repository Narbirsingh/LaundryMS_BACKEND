import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CustomerType } from '../common/enums';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() mobile: string;
  // Blank email from the form is treated as "no email" (null clears it on update)
  @ApiPropertyOptional() @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim?.() ?? value)) @IsOptional() @IsEmail() email?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deliveryAddress?: string;
  @ApiPropertyOptional({ enum: CustomerType }) @IsOptional() @IsEnum(CustomerType) type?: CustomerType;
  @ApiPropertyOptional() @IsOptional() @IsString() gstin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferences?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() garmentInstructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto, userId: string, organizationId: string, branchId: string) {
    const existing = await this.customerRepository.findOne({
      where: { mobile: dto.mobile, organizationId },
    });
    if (existing) throw new ConflictException('Customer with this mobile already exists');

    const customerCode = await this.generateCustomerCode(organizationId);
    const customer = this.customerRepository.create({
      ...dto,
      customerCode,
      organizationId,
      branchId,
      type: dto.type || CustomerType.INDIVIDUAL,
      createdBy: userId,
    });

    return this.customerRepository.save(customer);
  }

  async findAll(
    organizationId: string,
    page = 1,
    limit = 20,
    search?: string,
    type?: CustomerType,
  ) {
    const query = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.organizationId = :organizationId', { organizationId });

    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.mobile ILIKE :search OR customer.customerCode ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type) {
      query.andWhere('customer.type = :type', { type });
    }

    query.skip((page - 1) * limit).take(limit).orderBy('customer.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.customerRepository.findOne({ where: { id, organizationId } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>, userId: string, organizationId: string) {
    const customer = await this.findOne(id, organizationId);
    Object.assign(customer, { ...dto, updatedBy: userId });
    return this.customerRepository.save(customer);
  }

  async getStats(id: string, organizationId: string) {
    const customer = await this.findOne(id, organizationId);
    return {
      customer,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      walletBalance: customer.walletBalance,
      outstandingBalance: customer.outstandingBalance,
      loyaltyPoints: customer.loyaltyPoints,
    };
  }

  private async generateCustomerCode(organizationId: string): Promise<string> {
    const count = await this.customerRepository.count({ where: { organizationId } });
    return `CUST${String(count + 1001).padStart(5, '0')}`;
  }
}
