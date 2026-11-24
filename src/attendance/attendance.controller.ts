import { Controller, Get, Post, Patch, Param, Body, Request, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.organizationId);
  }

  @Get()
  listRecords(@Request() req: any, @Query() params: any) {
    return this.service.listRecords(req.user.organizationId, params);
  }

  @Post()
  mark(@Request() req: any, @Body() data: any) {
    return this.service.markAttendance(req.user.organizationId, data);
  }

  @Post('check-in')
  checkIn(@Request() req: any, @Body() body: { employeeId: string }) {
    return this.service.checkIn(req.user.organizationId, body.employeeId);
  }

  @Post('check-out')
  checkOut(@Request() req: any, @Body() body: { employeeId: string }) {
    return this.service.checkOut(req.user.organizationId, body.employeeId);
  }

  @Get('shifts')
  listShifts(@Request() req: any) {
    return this.service.listShifts(req.user.organizationId);
  }

  @Post('shifts')
  createShift(@Request() req: any, @Body() data: any) {
    return this.service.createShift(req.user.organizationId, data);
  }

  @Get('leaves')
  listLeaves(@Request() req: any, @Query() params: any) {
    return this.service.listLeaveRequests(req.user.organizationId, params);
  }

  @Post('leaves')
  requestLeave(@Request() req: any, @Body() data: any) {
    return this.service.createLeaveRequest(req.user.organizationId, data);
  }

  @Patch('leaves/:id/approve')
  approveLeave(@Request() req: any, @Param('id') id: string) {
    return this.service.approveLeave(id, req.user.organizationId, req.user.id);
  }
}
