import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, Payment, JournalEntry } from '../entities/billing.entity';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment, JournalEntry, Order, Customer])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
