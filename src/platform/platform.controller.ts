import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseBoolPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { PlatformService } from './platform.service';
import {
  RegisterLaundryDto, EditLaundryDto, UpdateOrgStatusDto,
  UpdateOrgConfigDto, PlatformFilterDto, ResetPasswordDto,
} from './dto/platform.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SetupSuperAdminDto {
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() name?: string;
}

@ApiTags('Platform')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN)
@Controller('platform')
export class PlatformController {
  constructor(private readonly svc: PlatformService) {}

  @Public()
  @Post('setup')
  setupSuperAdmin(@Body() dto: SetupSuperAdminDto) {
    return this.svc.setupSuperAdmin(dto);
  }

  @Get('stats')
  getStats() { return this.svc.getPlatformStats(); }

  @Get('analytics/registrations')
  getMonthlyRegistrations() { return this.svc.getMonthlyRegistrations(); }

  @Get('analytics/revenue')
  getRevenueByOrg() { return this.svc.getRevenueByOrg(); }

  @Get('analytics/status-distribution')
  getStatusDistribution() { return this.svc.getStatusDistribution(); }

  @Get('organizations')
  listOrganizations(@Query() filters: PlatformFilterDto) {
    return this.svc.listOrganizations(filters);
  }

  @Post('organizations')
  registerLaundry(@Body() dto: RegisterLaundryDto) {
    return this.svc.registerLaundry(dto);
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.svc.getOrganization(id);
  }

  @Patch('organizations/:id')
  editOrganization(@Param('id') id: string, @Body() dto: EditLaundryDto) {
    return this.svc.editOrganization(id, dto);
  }

  @Patch('organizations/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrgStatusDto) {
    return this.svc.updateStatus(id, dto);
  }

  @Patch('organizations/:id/config')
  updateConfig(@Param('id') id: string, @Body() dto: UpdateOrgConfigDto) {
    return this.svc.updateConfig(id, dto);
  }

  @Post('organizations/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.svc.resetAdminPassword(id, dto);
  }

  @Post('organizations/:id/switch')
  switchContext(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.switchContext(user, id);
  }

  @Delete('organizations/:id')
  @ApiQuery({ name: 'force', required: false })
  deleteOrganization(
    @Param('id') id: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
  ) {
    return this.svc.deleteOrganization(id, force);
  }
}
