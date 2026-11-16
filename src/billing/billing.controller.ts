import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Billing dashboard stats' })
  getStats(@CurrentUser() user: any) {
    return this.billingService.getBillingStats(user.organizationId);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  listInvoices(
    @CurrentUser() user: any,
    @Query('customerId') customerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.findAllInvoices(user.organizationId, user.branchId, customerId, +page || 1, +limit || 20);
  }

  @Post('invoices/from-order/:orderId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.RECEPTION_STAFF)
  @ApiOperation({ summary: 'Generate invoice from order' })
  createFromOrder(@Param('orderId') orderId: string, @CurrentUser() user: any) {
    return this.billingService.createInvoiceFromOrder(orderId, user.sub, user.organizationId, user.branchId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  getInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.billingService.findOneInvoice(id, user.organizationId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments' })
  listPayments(
    @CurrentUser() user: any,
    @Query('customerId') customerId?: string,
    @Query('page') page?: string,
  ) {
    return this.billingService.findAllPayments(user.organizationId, customerId, +page || 1);
  }

  @Post('payments')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTANT, UserRole.RECEPTION_STAFF)
  @ApiOperation({ summary: 'Record payment' })
  recordPayment(@Body() dto: any, @CurrentUser() user: any) {
    return this.billingService.recordPayment(dto, user.sub, user.organizationId, user.branchId);
  }
}
