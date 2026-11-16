import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
}

export enum ShiftType {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  CUSTOM = 'CUSTOM',
}

@Entity('shifts')
export class Shift extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ShiftType, default: ShiftType.MORNING })
  type: ShiftType;

  @Column({ name: 'start_time' })
  startTime: string;

  @Column({ name: 'end_time' })
  endTime: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

@Entity('attendance_records')
export class AttendanceRecord extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: string;

  @Column({ type: 'date', name: 'date' })
  date: Date;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ nullable: true, name: 'shift_id' })
  shiftId?: string;

  @ManyToOne(() => Shift)
  @JoinColumn({ name: 'shift_id' })
  shift?: Shift;

  @Column({ nullable: true, name: 'check_in' })
  checkIn?: Date;

  @Column({ nullable: true, name: 'check_out' })
  checkOut?: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'hours_worked' })
  hoursWorked?: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, name: 'overtime_hours' })
  overtimeHours?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy?: string;
}

@Entity('leave_requests')
export class LeaveRequest extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ type: 'date', name: 'from_date' })
  fromDate: Date;

  @Column({ type: 'date', name: 'to_date' })
  toDate: Date;

  @Column({ name: 'leave_type' })
  leaveType: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'enum', enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
  status: string;

  @Column({ nullable: true, name: 'approved_by' })
  approvedBy?: string;
}
