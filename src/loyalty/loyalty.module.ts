import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyAccount, LoyaltyTransaction, MembershipPlan, MembershipSubscription } from '../entities/loyalty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyAccount, LoyaltyTransaction, MembershipPlan, MembershipSubscription])],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
