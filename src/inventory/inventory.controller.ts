import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.inventoryService.getStats(user.organizationId);
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStockAlerts(user.organizationId);
  }

  @Get('vendors')
  findVendors(@CurrentUser() user: any) {
    return this.inventoryService.findAllVendors(user.organizationId);
  }

  @Post('vendors')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.INVENTORY_MANAGER)
  createVendor(@Body() dto: any, @CurrentUser() user: any) {
    return this.inventoryService.createVendor(dto, user.sub, user.organizationId);
  }

  @Patch('vendors/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.INVENTORY_MANAGER)
  updateVendor(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.inventoryService.updateVendor(id, dto, user.sub, user.organizationId);
  }

  @Get('items')
  findItems(@CurrentUser() user: any, @Query('lowStock') lowStock?: string) {
    return this.inventoryService.findAllItems(user.organizationId, user.branchId, lowStock === 'true');
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inventoryService.findOneItem(id, user.organizationId);
  }

  @Post('items')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.INVENTORY_MANAGER)
  createItem(@Body() dto: any, @CurrentUser() user: any) {
    return this.inventoryService.createItem(dto, user.sub, user.organizationId);
  }

  @Patch('items/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.INVENTORY_MANAGER)
  updateItem(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.inventoryService.updateItem(id, dto, user.sub, user.organizationId);
  }

  @Post('items/:id/adjust')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER, UserRole.INVENTORY_MANAGER, UserRole.OPERATIONS_MANAGER)
  @ApiOperation({ summary: 'Adjust stock (IN/OUT/SET)' })
  adjustStock(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.inventoryService.adjustStock(id, dto, user.sub, user.organizationId);
  }
}
