import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Customer } from '../entities/customer.entity';
import { Invoice, Payment } from '../entities/billing.entity';
import { Expense } from '../entities/employee.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Customer, Invoice, Payment, Expense])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
