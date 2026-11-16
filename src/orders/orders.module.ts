import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderItem, OrderStatusHistory } from '../entities/order.entity';
import { Garment } from '../entities/garment.entity';
import { Customer } from '../entities/customer.entity';
import { Organization } from '../entities/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderItem, OrderStatusHistory, Garment, Customer, Organization,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
