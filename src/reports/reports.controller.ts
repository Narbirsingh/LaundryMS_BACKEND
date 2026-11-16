import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Reports')
@ApiBearerAuth()
@Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.OPERATIONS_MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSales(@CurrentUser() user: any, @Query('period') period?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSalesReport(user.organizationId, period, from, to);
  }

  @Get('financial')
  getFinancial(@CurrentUser() user: any, @Query('period') period?: string) {
    return this.reportsService.getFinancialReport(user.organizationId, period);
  }

  @Get('customers')
  getCustomers(@CurrentUser() user: any) {
    return this.reportsService.getCustomerReport(user.organizationId);
  }
}
