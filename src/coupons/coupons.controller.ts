import { Controller, Get, Post, Patch, Param, Body, Request, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly service: CouponsService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get()
  list(@Request() req: any) {
    return this.service.list(req.user.organizationId);
  }

  @Post('validate')
  validate(@Request() req: any, @Body() body: any) {
    return this.service.validate(body.code, req.user.organizationId, body.customerId, body.orderValue);
  }

  @Post('apply')
  apply(@Request() req: any, @Body() body: any) {
    return this.service.apply(body.couponId, req.user.organizationId, body.customerId, body.orderId, body.discountAmount);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.service.create(req.user.organizationId, data);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.update(id, req.user.organizationId, data);
  }

  @Patch(':id/deactivate')
  deactivate(@Request() req: any, @Param('id') id: string) {
    return this.service.deactivate(id, req.user.organizationId);
  }
}
