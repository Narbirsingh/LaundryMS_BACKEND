import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.expensesService.getStats(user.organizationId);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.expensesService.findAll(user.organizationId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.expensesService.create(dto, user.sub, user.organizationId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.expensesService.update(id, dto, user.sub, user.organizationId);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.approve(id, user.sub, user.organizationId);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  reject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.expensesService.reject(id, user.sub, user.organizationId);
  }
}
