import { Injectable, NotFoundException, ConflictException, BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Branch } from '../entities/branch.entity';
import { Order } from '../entities/order.entity';
import { OrganizationStatus, SubscriptionPlan, UserRole } from '../common/enums';
import {
  RegisterLaundryDto, EditLaundryDto, UpdateOrgStatusDto,
  UpdateOrgConfigDto, PlatformFilterDto, ResetPasswordDto,
} from './dto/platform.dto';

@Injectable()
export class PlatformService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Organization) private orgRepo: Repository<Organization>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Branch) private branchRepo: Repository<Branch>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    await this.seedSuperAdmin();
  }

  async seedSuperAdmin() {
    const existing = await this.userRepo.findOne({ where: { role: UserRole.SUPER_ADMIN } });
    if (existing) {
      console.log(`✅ Super Admin exists: ${existing.email}`);
      return;
    }

    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');
    const name = this.configService.get<string>('SUPER_ADMIN_NAME', 'Super Admin');

    if (!email || !password) {
      console.warn('⚠️  SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env — skipping seed');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const admin = this.userRepo.create({
      name,
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      organizationId: null,
    });
    await this.userRepo.save(admin);
    console.log(`✅ Super Admin created: ${email}`);
  }

  async setupSuperAdmin(dto: { email: string; password: string; name?: string }) {
    const existing = await this.userRepo.findOne({ where: { role: UserRole.SUPER_ADMIN } });
    if (existing) {
      throw new ConflictException('Super Admin already exists. Use login instead.');
    }

    const emailTaken = await this.userRepo.findOne({ where: { email: dto.email } });
    if (emailTaken) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = this.userRepo.create({
      name: dto.name || 'Super Admin',
      email: dto.email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      organizationId: null,
    });
    await this.userRepo.save(admin);
    return { message: 'Super Admin account created. You can now login.' };
  }

  async getPlatformStats() {
    const [
      totalLaundries,
      activeLaundries,
      pendingLaundries,
      suspendedLaundries,
      blockedLaundries,
      inactiveLaundries,
      totalOrders,
      totalRevResult,
    ] = await Promise.all([
      this.orgRepo.count(),
      this.orgRepo.count({ where: { status: OrganizationStatus.ACTIVE } }),
      this.orgRepo.count({ where: { status: OrganizationStatus.PENDING } }),
      this.orgRepo.count({ where: { status: OrganizationStatus.SUSPENDED } }),
      this.orgRepo.count({ where: { status: OrganizationStatus.BLOCKED } }),
      this.orgRepo.count({ where: { status: OrganizationStatus.INACTIVE } }),
      this.orderRepo.count(),
      this.orderRepo.createQueryBuilder('o').select('SUM(o.totalAmount)', 'total').getRawOne(),
    ]);

    return {
      totalLaundries,
      activeLaundries,
      pendingLaundries,
      suspendedLaundries,
      blockedLaundries,
      inactiveLaundries,
      totalOrders,
      totalPlatformRevenue: parseFloat(totalRevResult?.total) || 0,
    };
  }

  async listOrganizations(filters: PlatformFilterDto) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const qb = this.orgRepo.createQueryBuilder('org');

    if (filters.search) {
      qb.andWhere(
        '(org.businessName ILIKE :s OR org.email ILIKE :s OR org.phone ILIKE :s OR org.ownerName ILIKE :s OR CAST(org.id AS TEXT) ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }
    if (filters.status) {
      qb.andWhere('org.status = :status', { status: filters.status });
    }
    if (filters.city) {
      qb.andWhere('org.city ILIKE :city', { city: `%${filters.city}%` });
    }
    if (filters.dateFrom) {
      qb.andWhere('org.createdAt >= :from', { from: new Date(filters.dateFrom) });
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('org.createdAt <= :to', { to });
    }

    // Sort
    switch (filters.sort) {
      case 'name_asc':   qb.orderBy('org.businessName', 'ASC'); break;
      case 'name_desc':  qb.orderBy('org.businessName', 'DESC'); break;
      case 'status':     qb.orderBy('org.status', 'ASC'); break;
      case 'oldest':     qb.orderBy('org.createdAt', 'ASC'); break;
      default:           qb.orderBy('org.createdAt', 'DESC'); // newest
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrganization(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    const [totalOrders, totalRevResult, staffCount, branchCount, adminUser] = await Promise.all([
      this.orderRepo.count({ where: { organizationId: id } }),
      this.orderRepo.createQueryBuilder('o').select('SUM(o.totalAmount)', 'total').where('o.organizationId = :id', { id }).getRawOne(),
      this.userRepo.count({ where: { organizationId: id } }),
      this.branchRepo.count({ where: { organizationId: id } }),
      this.userRepo.findOne({ where: { organizationId: id, role: UserRole.BUSINESS_OWNER } }),
    ]);

    return {
      ...org,
      adminUser: adminUser ? { id: adminUser.id, email: adminUser.email, name: adminUser.name } : null,
      stats: {
        totalOrders,
        totalRevenue: parseFloat(totalRevResult?.total) || 0,
        staffCount,
        branchCount,
      },
    };
  }

  async registerLaundry(dto: RegisterLaundryDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.adminEmail } });
    if (existing) throw new ConflictException('Admin email already in use');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const org = qr.manager.create(Organization, {
        businessName: dto.businessName,
        ownerName: dto.ownerName,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        gstin: dto.gstin,
        registrationNumber: dto.registrationNumber,
        country: dto.country,
        state: dto.state,
        city: dto.city,
        address: dto.address,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        logo: dto.logo,
        pickupDeliveryAvailable: dto.pickupDeliveryAvailable ?? false,
        serviceAreas: dto.serviceAreas,
        commissionPercentage: dto.commissionPercentage ?? 0,
        subscriptionPlan: dto.subscriptionPlan ?? SubscriptionPlan.FREE,
        status: OrganizationStatus.ACTIVE,
        isActive: true,
      });
      await qr.manager.save(org);

      const branch = qr.manager.create(Branch, {
        organizationId: org.id,
        name: 'Main Branch',
        code: 'MAIN',
        isActive: true,
      });
      await qr.manager.save(branch);

      const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
      const user = qr.manager.create(User, {
        organizationId: org.id,
        branchId: branch.id,
        name: dto.ownerName,
        email: dto.adminEmail,
        passwordHash,
        phone: dto.phone,
        role: UserRole.BUSINESS_OWNER,
        isActive: true,
        isEmailVerified: true,
      });
      await qr.manager.save(user);
      await qr.commitTransaction();
      return { organization: org, user: { id: user.id, email: user.email, role: user.role } };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async editOrganization(id: string, dto: EditLaundryDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    const updateData: Partial<Organization> = {};
    if (dto.businessName !== undefined) updateData.businessName = dto.businessName;
    if (dto.ownerName !== undefined) updateData.ownerName = dto.ownerName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.alternatePhone !== undefined) updateData.alternatePhone = dto.alternatePhone;
    if (dto.gstin !== undefined) updateData.gstin = dto.gstin;
    if (dto.registrationNumber !== undefined) updateData.registrationNumber = dto.registrationNumber;
    if (dto.country !== undefined) updateData.country = dto.country;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.pincode !== undefined) updateData.pincode = dto.pincode;
    if (dto.logo !== undefined) updateData.logo = dto.logo;
    if (dto.pickupDeliveryAvailable !== undefined) updateData.pickupDeliveryAvailable = dto.pickupDeliveryAvailable;

    // Also update the BUSINESS_OWNER user's name if ownerName changed
    if (dto.ownerName) {
      await this.userRepo.update(
        { organizationId: id, role: UserRole.BUSINESS_OWNER },
        { name: dto.ownerName },
      );
    }

    await this.orgRepo.update(id, updateData);
    return this.orgRepo.findOne({ where: { id } });
  }

  async updateStatus(id: string, dto: UpdateOrgStatusDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    const update: Partial<Organization> = { status: dto.status };
    switch (dto.status) {
      case OrganizationStatus.ACTIVE:
        update.approvedAt = new Date();
        update.isActive = true;
        break;
      case OrganizationStatus.SUSPENDED:
        update.suspendedAt = new Date();
        update.isActive = false;
        break;
      case OrganizationStatus.BLOCKED:
        update.blockedAt = new Date();
        update.blockReason = dto.reason;
        update.isActive = false;
        break;
      case OrganizationStatus.INACTIVE:
        update.deactivatedAt = new Date();
        update.isActive = false;
        break;
      case OrganizationStatus.REJECTED:
        update.rejectionReason = dto.reason;
        update.isActive = false;
        break;
    }

    await this.orgRepo.update(id, update);
    return this.orgRepo.findOne({ where: { id } });
  }

  async updateConfig(id: string, dto: UpdateOrgConfigDto) {
    await this.orgRepo.findOneOrFail({ where: { id } });
    await this.orgRepo.update(id, dto as any);
    return this.orgRepo.findOne({ where: { id } });
  }

  async deleteOrganization(id: string, force = false) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    if (!force) {
      const orderCount = await this.orderRepo.count({ where: { organizationId: id } });
      if (orderCount > 0) {
        throw new BadRequestException(
          `Cannot delete: this laundry has ${orderCount} orders. Use force=true to override.`,
        );
      }
    }

    // Soft delete via status (safest) unless force is true
    if (!force) {
      await this.orgRepo.update(id, {
        status: OrganizationStatus.INACTIVE,
        isActive: false,
        deactivatedAt: new Date(),
      });
      return { message: 'Organization deactivated' };
    }

    // Hard delete — cascade must be handled by DB foreign keys
    await this.orgRepo.delete(id);
    return { message: 'Organization permanently deleted' };
  }

  async resetAdminPassword(id: string, dto: ResetPasswordDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    const adminUser = await this.userRepo.findOne({
      where: { organizationId: id, role: UserRole.BUSINESS_OWNER },
    });
    if (!adminUser) throw new NotFoundException('Admin user not found for this organization');

    if (dto.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepo.update(adminUser.id, {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    return { message: 'Password reset successfully', adminEmail: adminUser.email };
  }

  async switchContext(superAdminUser: any, orgId: string) {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    const payload = {
      sub: superAdminUser.userId,
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
      organizationId: orgId,
      branchId: null,
      isSwitched: true,
      originalUserId: superAdminUser.userId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '8h',
    });

    return { accessToken, organization: { id: org.id, businessName: org.businessName } };
  }

  async getMonthlyRegistrations() {
    const result = await this.orgRepo
      .createQueryBuilder('org')
      .select("DATE_TRUNC('month', org.createdAt)", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy("DATE_TRUNC('month', org.createdAt)")
      .orderBy('month', 'ASC')
      .limit(12)
      .getRawMany();
    return result;
  }

  async getRevenueByOrg() {
    return this.orderRepo
      .createQueryBuilder('o')
      .select('o.organizationId', 'orgId')
      .addSelect('org.businessName', 'businessName')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .leftJoin(Organization, 'org', 'org.id = o.organizationId')
      .groupBy('o.organizationId')
      .addGroupBy('org.businessName')
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany();
  }

  async getStatusDistribution() {
    const result = await this.orgRepo
      .createQueryBuilder('org')
      .select('org.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('org.status')
      .getRawMany();
    return result;
  }
}
