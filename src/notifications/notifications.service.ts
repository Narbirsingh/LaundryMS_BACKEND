import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate, NotificationLog } from '../entities/notification.entity';
import { NotificationChannel, NotificationStatus } from '../common/enums';

const DEFAULT_TEMPLATES = [
  { eventType: 'ORDER_CREATED', channel: NotificationChannel.SMS, body: 'Hi {customerName}, your order #{orderNumber} has been received. We will notify you at every step!' },
  { eventType: 'PICKUP_SCHEDULED', channel: NotificationChannel.SMS, body: 'Hi {customerName}, your pickup is scheduled. Our rider will arrive soon.' },
  { eventType: 'READY_FOR_DISPATCH', channel: NotificationChannel.SMS, body: 'Hi {customerName}, your order #{orderNumber} is ready for delivery!' },
  { eventType: 'DELIVERED', channel: NotificationChannel.SMS, body: 'Hi {customerName}, your order #{orderNumber} has been delivered. Thank you!' },
  { eventType: 'ORDER_CREATED', channel: NotificationChannel.WHATSAPP, body: '🧺 Hi {customerName}! Your laundry order #{orderNumber} has been received.\n\nExpected delivery: {expectedDelivery}\nTotal: ₹{total}' },
];

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationTemplate) private templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(NotificationLog) private logRepo: Repository<NotificationLog>,
  ) {}

  async listTemplates(orgId: string) {
    return this.templateRepo.find({ where: { organizationId: orgId } });
  }

  async createTemplate(orgId: string, data: any) {
    return this.templateRepo.save(this.templateRepo.create({ ...data, organizationId: orgId }));
  }

  async updateTemplate(id: string, orgId: string, data: any) {
    await this.templateRepo.update({ id, organizationId: orgId }, data);
    return this.templateRepo.findOne({ where: { id } });
  }

  async seedDefaultTemplates(orgId: string) {
    const existing = await this.templateRepo.count({ where: { organizationId: orgId } });
    if (existing > 0) return { seeded: false };
    const templates = DEFAULT_TEMPLATES.map(t => this.templateRepo.create({ ...t, organizationId: orgId, name: `${t.eventType} - ${t.channel}`, isDefault: true }));
    await this.templateRepo.save(templates);
    return { seeded: true, count: templates.length };
  }

  async sendNotification(orgId: string, data: {
    customerId?: string;
    orderId?: string;
    recipientName?: string;
    recipientContact: string;
    channel: NotificationChannel;
    eventType: string;
    subject?: string;
    body: string;
  }) {
    const log = this.logRepo.create({
      ...data,
      organizationId: orgId,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    return this.logRepo.save(log);
  }

  async listLogs(orgId: string, params: any) {
    return this.logRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
      take: params?.limit || 50,
    });
  }

  async getStats(orgId: string) {
    const total = await this.logRepo.count({ where: { organizationId: orgId } });
    const sent = await this.logRepo.count({ where: { organizationId: orgId, status: NotificationStatus.SENT } });
    const failed = await this.logRepo.count({ where: { organizationId: orgId, status: NotificationStatus.FAILED } });
    return { total, sent, failed };
  }
}
