import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Branch } from '../entities/branch.entity';
import { UserRole, OrganizationStatus } from '../common/enums';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const org = queryRunner.manager.create(Organization, {
        businessName: dto.businessName,
        email: dto.email,
        phone: dto.phone,
        gstin: dto.gstin,
      });
      await queryRunner.manager.save(org);

      const branch = queryRunner.manager.create(Branch, {
        organizationId: org.id,
        name: 'Main Branch',
        code: 'MAIN',
        isActive: true,
      });
      await queryRunner.manager.save(branch);

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = queryRunner.manager.create(User, {
        organizationId: org.id,
        branchId: branch.id,
        name: dto.name,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: UserRole.BUSINESS_OWNER,
        isActive: true,
        isEmailVerified: false,
      });
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      const tokens = await this.generateTokens(user);
      return {
        user: this.sanitizeUser(user),
        organization: org,
        ...tokens,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true, email: true, name: true, passwordHash: true, role: true,
        organizationId: true, branchId: true, isActive: true, permissions: true,
        failedLoginAttempts: true, lockedUntil: true, mfaEnabled: true,
      } as any,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`
      );
    }

    // Check organization status for non-SUPER_ADMIN users
    if (user.role !== UserRole.SUPER_ADMIN && user.organizationId) {
      const org = await this.orgRepository.findOne({ where: { id: user.organizationId } });
      if (org) {
        if (org.status === OrganizationStatus.BLOCKED) {
          throw new UnauthorizedException('Your laundry account has been blocked. Please contact platform support.');
        }
        if (org.status === OrganizationStatus.SUSPENDED) {
          throw new UnauthorizedException('Your laundry account has been suspended. Please contact platform support.');
        }
        if (org.status === OrganizationStatus.REJECTED) {
          throw new UnauthorizedException('Your laundry registration was rejected. Please contact platform support.');
        }
        if (org.status === OrganizationStatus.INACTIVE) {
          throw new UnauthorizedException('Your laundry account is inactive. Please contact platform support.');
        }
      }
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.userRepository.increment({ id: user.id }, 'failedLoginAttempts', 1);
      const updated = await this.userRepository.findOne({ where: { id: user.id } });
      const attempts = updated?.failedLoginAttempts ?? 0;
      if (attempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);
        await this.userRepository.update(user.id, { lockedUntil: lockUntil });
        throw new UnauthorizedException(
          'Account locked for 30 minutes due to too many failed attempts. Contact support or wait and try again.'
        );
      }
      const remaining = 5 - attempts;
      throw new UnauthorizedException(
        `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account is locked.`
      );
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user);
    await this.userRepository.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, email: true, role: true, organizationId: true, branchId: true, refreshToken: true, isActive: true } as any,
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.userRepository.update(user.id, {
      refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshToken: undefined });
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { id: true, passwordHash: true } as any,
    });

    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.update(userId, { passwordHash });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (user) {
      const token = uuidv4();
      const expires = new Date();
      expires.setHours(expires.getHours() + 2);
      await this.userRepository.update(user.id, {
        passwordResetToken: token,
        passwordResetExpires: expires,
      });
      // In production: send email with reset link
    }
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: dto.token },
      select: { id: true, passwordResetToken: true, passwordResetExpires: true } as any,
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  private async generateTokens(user: Partial<User>) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    const { passwordHash, refreshToken, mfaSecret, passwordResetToken, ...safe } = user as any;
    return safe;
  }
}
