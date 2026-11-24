import {
  IsString, IsOptional, IsEmail, IsEnum, IsNumber, IsBoolean,
  IsArray, Min, Max, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus, SubscriptionPlan } from '../../common/enums';

export class RegisterLaundryDto {
  @ApiProperty() @IsString() businessName: string;
  @ApiProperty() @IsString() ownerName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alternatePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pickupDeliveryAvailable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) serviceAreas?: string[];

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(SubscriptionPlan) subscriptionPlan?: SubscriptionPlan;

  @ApiProperty() @IsEmail() adminEmail: string;
  @ApiProperty() @IsString() adminPassword: string;
}

export class EditLaundryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alternatePhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gstin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pincode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pickupDeliveryAvailable?: boolean;
}

export class UpdateOrgStatusDto {
  @ApiProperty({ enum: OrganizationStatus }) @IsEnum(OrganizationStatus) status: OrganizationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class UpdateOrgConfigDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) commissionPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsEnum(SubscriptionPlan) subscriptionPlan?: SubscriptionPlan;
}

export class ResetPasswordDto {
  @ApiProperty() @IsString() newPassword: string;
}

export class PlatformFilterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: OrganizationStatus }) @IsOptional() @IsEnum(OrganizationStatus) status?: OrganizationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sort?: string;
  @ApiPropertyOptional() @IsOptional() page?: number;
  @ApiPropertyOptional() @IsOptional() limit?: number;
}
