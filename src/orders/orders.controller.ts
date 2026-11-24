import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import {
  CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto,
} from './dto/order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Order dashboard stats' })
  getDashboard(@CurrentUser() user: any) {
    return this.ordersService.getDashboardStats(user.organizationId, user.branchId);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders with filters' })
  findAll(@Query() filters: OrderFilterDto, @CurrentUser() user: any) {
    return this.ordersService.findAll(filters, user.organizationId);
  }

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER,
    UserRole.RECEPTION_STAFF, UserRole.OPERATIONS_MANAGER,
  )
  @ApiOperation({ summary: 'Create new order' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user.id, user.organizationId, user.branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findOne(id, user.organizationId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user.id, user.organizationId, user.branchId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get order status history' })
  getHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getStatusHistory(id, user.organizationId);
  }
}
