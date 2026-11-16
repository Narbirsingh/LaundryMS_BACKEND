import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRecord, Shift, LeaveRequest, AttendanceStatus } from '../entities/attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceRecord) private recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(Shift) private shiftRepo: Repository<Shift>,
    @InjectRepository(LeaveRequest) private leaveRepo: Repository<LeaveRequest>,
  ) {}

  async listRecords(orgId: string, params: any) {
    const qb = this.recordRepo.createQueryBuilder('a')
      .where('a.organizationId = :orgId', { orgId });
    if (params?.employeeId) qb.andWhere('a.employeeId = :eid', { eid: params.employeeId });
    if (params?.from) qb.andWhere('a.date >= :from', { from: params.from });
    if (params?.to) qb.andWhere('a.date <= :to', { to: params.to });
    return qb.orderBy('a.date', 'DESC').take(200).getMany();
  }

  async markAttendance(orgId: string, data: any) {
    const existing = await this.recordRepo.findOne({
      where: { organizationId: orgId, employeeId: data.employeeId, date: data.date },
    });
    if (existing) {
      await this.recordRepo.update(existing.id, data);
      return this.recordRepo.findOne({ where: { id: existing.id } });
    }
    return this.recordRepo.save(this.recordRepo.create({ ...data, organizationId: orgId }));
  }

  async checkIn(orgId: string, employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.recordRepo.findOne({
      where: { organizationId: orgId, employeeId, date: today as any },
    });
    if (existing) {
      await this.recordRepo.update(existing.id, { checkIn: new Date(), status: AttendanceStatus.PRESENT });
      return this.recordRepo.findOne({ where: { id: existing.id } });
    }
    return this.recordRepo.save(this.recordRepo.create({
      organizationId: orgId,
      employeeId,
      date: today as any,
      checkIn: new Date(),
      status: AttendanceStatus.PRESENT,
    }));
  }

  async checkOut(orgId: string, employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = await this.recordRepo.findOne({
      where: { organizationId: orgId, employeeId, date: today as any },
    });
    if (record && record.checkIn) {
      const checkOut = new Date();
      const ms = checkOut.getTime() - new Date(record.checkIn).getTime();
      const hours = Math.round((ms / 3600000) * 100) / 100;
      await this.recordRepo.update(record.id, { checkOut, hoursWorked: hours });
    }
    return record;
  }

  async listShifts(orgId: string) {
    return this.shiftRepo.find({ where: { organizationId: orgId, isActive: true } });
  }

  async createShift(orgId: string, data: any) {
    return this.shiftRepo.save(this.shiftRepo.create({ ...data, organizationId: orgId }));
  }

  async listLeaveRequests(orgId: string, params: any) {
    return this.leaveRepo.find({ where: { organizationId: orgId }, order: { createdAt: 'DESC' } });
  }

  async createLeaveRequest(orgId: string, data: any) {
    return this.leaveRepo.save(this.leaveRepo.create({ ...data, organizationId: orgId }));
  }

  async approveLeave(id: string, orgId: string, approverId: string) {
    await this.leaveRepo.update({ id, organizationId: orgId }, { status: 'APPROVED', approvedBy: approverId });
    return this.leaveRepo.findOne({ where: { id } });
  }

  async getStats(orgId: string) {
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await this.recordRepo.count({
      where: { organizationId: orgId, date: today as any, status: AttendanceStatus.PRESENT },
    });
    const pendingLeaves = await this.leaveRepo.count({ where: { organizationId: orgId, status: 'PENDING' } });
    return { presentToday, pendingLeaves };
  }
}
