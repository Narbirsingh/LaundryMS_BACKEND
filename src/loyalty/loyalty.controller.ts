import { Controller, Get, Post, Patch, Param, Body, Request, Query } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly service: LoyaltyService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get('account/:customerId')
  getAccount(@Request() req: any, @Param('customerId') customerId: string) {
    return this.service.getOrCreateAccount(customerId, req.user.organizationId);
  }

  @Get('account/:customerId/transactions')
  getTransactions(@Request() req: any, @Param('customerId') customerId: string) {
    return this.service.getTransactions(customerId, req.user.organizationId);
  }

  @Post('earn')
  earn(@Request() req: any, @Body() body: any) {
    return this.service.earnPoints(body.customerId, req.user.organizationId, body.points, body.orderId, body.description);
  }

  @Post('redeem')
  redeem(@Request() req: any, @Body() body: any) {
    return this.service.redeemPoints(body.customerId, req.user.organizationId, body.points, body.orderId);
  }

  @Get('plans')
  listPlans(@Request() req: any) {
    return this.service.listPlans(req.user.organizationId);
  }

  @Post('plans')
  createPlan(@Request() req: any, @Body() data: any) {
    return this.service.createPlan(req.user.organizationId, data);
  }

  @Patch('plans/:id')
  updatePlan(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updatePlan(id, req.user.organizationId, data);
  }

  @Post('subscribe')
  subscribe(@Request() req: any, @Body() body: any) {
    return this.service.subscribe(body.customerId, req.user.organizationId, body.planId);
  }

  @Get('subscriptions')
  listSubscriptions(@Request() req: any, @Query() params: any) {
    return this.service.listSubscriptions(req.user.organizationId, params);
  }
}
