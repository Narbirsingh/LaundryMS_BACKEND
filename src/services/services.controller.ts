import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all services' })
  findAll(@CurrentUser() user: any, @Query('category') category?: any, @Query('activeOnly') activeOnly?: string) {
    return this.servicesService.findAll(user.organizationId, category, activeOnly !== 'false');
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get service categories' })
  getCategories() {
    return this.servicesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.findOne(id, user.organizationId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create service' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.servicesService.create(dto, user.sub, user.organizationId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update service' })
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.servicesService.update(id, dto, user.sub, user.organizationId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.remove(id, user.organizationId);
  }

  @Get(':id/price-lists')
  @ApiOperation({ summary: 'Get price lists for service' })
  getPriceLists(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.getPriceLists(id, user.organizationId);
  }

  @Post(':id/price-lists')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Set price list for service' })
  setPriceList(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.servicesService.setPriceList(id, dto, user.sub, user.organizationId);
  }
}
