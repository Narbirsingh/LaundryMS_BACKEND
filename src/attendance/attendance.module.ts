import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord, Shift, LeaveRequest } from '../entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceRecord, Shift, LeaveRequest])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
