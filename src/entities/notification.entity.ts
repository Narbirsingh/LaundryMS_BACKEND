import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { NotificationChannel, NotificationStatus } from '../common/enums';

@Entity('notification_templates')
export class NotificationTemplate extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column()
  name: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}

@Entity('notification_logs')
export class NotificationLog extends BaseEntity {
  @Index()
  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ nullable: true, name: 'customer_id' })
  customerId?: string;

  @Column({ nullable: true, name: 'order_id' })
  orderId?: string;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName?: string;

  @Column({ name: 'recipient_contact' })
  recipientContact: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'provider_response' })
  providerResponse?: Record<string, any>;
}
