import { Controller, Get, Post, Patch, Param, Body, Query, Request } from '@nestjs/common';
import { GarmentsService } from './garments.service';
import { GarmentStatus } from '../common/enums';

@Controller('garments')
export class GarmentsController {
  constructor(private readonly service: GarmentsService) {}

  @Get()
  list(@Request() req: any, @Query() params: any) {
    return this.service.list(req.user.organizationId, params);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get('by-order/:orderId')
  listByOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.service.listByOrder(orderId, req.user.organizationId);
  }

  @Get('tag/:tagId')
  findByTag(@Request() req: any, @Param('tagId') tagId: string) {
    return this.service.findByTag(tagId, req.user.organizationId);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.service.create(req.user.organizationId, req.user.branchId, data);
  }

  @Patch(':id/status')
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() body: { status: GarmentStatus }) {
    return this.service.updateStatus(id, req.user.organizationId, body.status);
  }

  @Post(':id/quality')
  recordQuality(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.recordQuality(id, req.user.organizationId, data);
  }

  @Get('batches')
  listBatches(@Request() req: any) {
    return this.service.listBatches(req.user.organizationId);
  }

  @Post('batches')
  createBatch(@Request() req: any, @Body() data: any) {
    return this.service.createBatch(req.user.organizationId, req.user.branchId, data);
  }
}
