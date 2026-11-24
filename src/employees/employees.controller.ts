import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.employeesService.getStats(user.organizationId);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.employeesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.employeesService.create(dto, user.sub, user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.employeesService.update(id, dto, user.sub, user.organizationId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  deactivate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.deactivate(id, user.sub, user.organizationId);
  }
}
