import { Controller, Get, Post, Patch, Param, Body, Request } from '@nestjs/common';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get('queue')
  getRiderQueue(@Request() req: any) {
    return this.service.getRiderQueue(req.user.organizationId);
  }

  @Get('pickup-queue')
  getPickupQueue(@Request() req: any) {
    return this.service.getPickupQueue(req.user.organizationId);
  }

  @Patch(':id/delivered')
  markDelivered(@Request() req: any, @Param('id') id: string, @Body() proof: any) {
    return this.service.markDelivered(id, req.user.organizationId, proof);
  }

  @Patch(':id/pickup-done')
  markPickupDone(@Request() req: any, @Param('id') id: string) {
    return this.service.markPickupDone(id, req.user.organizationId);
  }
}
