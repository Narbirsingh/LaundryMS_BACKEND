import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyAccount, LoyaltyTransaction, MembershipPlan, MembershipSubscription } from '../entities/loyalty.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyAccount) private accountRepo: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction) private txRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(MembershipPlan) private planRepo: Repository<MembershipPlan>,
    @InjectRepository(MembershipSubscription) private subRepo: Repository<MembershipSubscription>,
  ) {}

  async getAccount(customerId: string, orgId: string) {
    return this.accountRepo.findOne({ where: { customerId, organizationId: orgId } });
  }

  async getOrCreateAccount(customerId: string, orgId: string) {
    let account = await this.getAccount(customerId, orgId);
    if (!account) {
      account = await this.accountRepo.save(
        this.accountRepo.create({ customerId, organizationId: orgId, tier: 'SILVER' }),
      );
    }
    return account;
  }

  async earnPoints(customerId: string, orgId: string, points: number, orderId: string, description: string) {
    const account = await this.getOrCreateAccount(customerId, orgId);
    const newBalance = account.pointsBalance + points;
    await this.accountRepo.update(account.id, {
      pointsBalance: newBalance,
      lifetimePoints: account.lifetimePoints + points,
    });
    return this.txRepo.save(this.txRepo.create({
      loyaltyAccountId: account.id,
      organizationId: orgId,
      customerId,
      type: 'EARN',
      points,
      orderId,
      description,
      balanceAfter: newBalance,
    }));
  }

  async redeemPoints(customerId: string, orgId: string, points: number, orderId: string) {
    const account = await this.getAccount(customerId, orgId);
    if (!account || account.pointsBalance < points) throw new Error('Insufficient points');
    const newBalance = account.pointsBalance - points;
    await this.accountRepo.update(account.id, {
      pointsBalance: newBalance,
      lifetimeRedeemed: account.lifetimeRedeemed + points,
    });
    return this.txRepo.save(this.txRepo.create({
      loyaltyAccountId: account.id,
      organizationId: orgId,
      customerId,
      type: 'REDEEM',
      points: -points,
      orderId,
      description: 'Points redeemed',
      balanceAfter: newBalance,
    }));
  }

  async getTransactions(customerId: string, orgId: string) {
    return this.txRepo.find({
      where: { customerId, organizationId: orgId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  // Plans
  async listPlans(orgId: string) {
    return this.planRepo.find({ where: { organizationId: orgId, isActive: true } });
  }

  async createPlan(orgId: string, data: any) {
    return this.planRepo.save(this.planRepo.create({ ...data, organizationId: orgId }));
  }

  async updatePlan(id: string, orgId: string, data: any) {
    await this.planRepo.update({ id, organizationId: orgId }, data);
    return this.planRepo.findOne({ where: { id } });
  }

  // Subscriptions
  async subscribe(customerId: string, orgId: string, planId: string) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.validityDays * 86400000);
    return this.subRepo.save(this.subRepo.create({
      organizationId: orgId,
      customerId,
      planId,
      startDate,
      endDate,
      amountPaid: plan.price,
    }));
  }

  async listSubscriptions(orgId: string, params: any) {
    return this.subRepo.find({ where: { organizationId: orgId }, relations: { customer: true, plan: true } as any });
  }

  async getStats(orgId: string) {
    const totalAccounts = await this.accountRepo.count({ where: { organizationId: orgId } });
    const activeSubs = await this.subRepo.count({ where: { organizationId: orgId, isActive: true } });
    const totalPointsAwarded = await this.txRepo
      .createQueryBuilder('t')
      .select('SUM(t.points)', 'total')
      .where('t.organizationId = :orgId AND t.type = :type', { orgId, type: 'EARN' })
      .getRawOne();
    return { totalAccounts, activeSubs, totalPointsAwarded: totalPointsAwarded?.total || 0 };
  }
}
