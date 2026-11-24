import { Controller, Get, Post, Patch, Param, Body, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get('templates')
  listTemplates(@Request() req: any) {
    return this.service.listTemplates(req.user.organizationId);
  }

  @Post('templates')
  createTemplate(@Request() req: any, @Body() data: any) {
    return this.service.createTemplate(req.user.organizationId, data);
  }

  @Patch('templates/:id')
  updateTemplate(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.service.updateTemplate(id, req.user.organizationId, data);
  }

  @Post('templates/seed')
  seedDefaults(@Request() req: any) {
    return this.service.seedDefaultTemplates(req.user.organizationId);
  }

  @Post('send')
  send(@Request() req: any, @Body() data: any) {
    return this.service.sendNotification(req.user.organizationId, data);
  }

  @Get('logs')
  listLogs(@Request() req: any, @Query() params: any) {
    return this.service.listLogs(req.user.organizationId, params);
  }
}
