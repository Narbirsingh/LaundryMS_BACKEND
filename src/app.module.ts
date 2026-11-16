import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { CaModule } from './ca/ca.module';
import { ServicesModule } from './services/services.module';
import { BillingModule } from './billing/billing.module';
import { InventoryModule } from './inventory/inventory.module';
import { ExpensesModule } from './expenses/expenses.module';
import { EmployeesModule } from './employees/employees.module';
import { ReportsModule } from './reports/reports.module';
import { GarmentsModule } from './garments/garments.module';
import { BranchesModule } from './branches/branches.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DeliveryModule } from './delivery/delivery.module';
import { PlatformModule } from './platform/platform.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

import { Organization } from './entities/organization.entity';
import { Branch } from './entities/branch.entity';
import { User } from './entities/user.entity';
import { Customer } from './entities/customer.entity';
import { Service, ServicePriceList } from './entities/service.entity';
import { Order, OrderItem, OrderStatusHistory } from './entities/order.entity';
import { Garment, ProcessingBatch, QualityInspection } from './entities/garment.entity';
import { Invoice, Payment, JournalEntry } from './entities/billing.entity';
import { Vendor, InventoryItem, InventoryTransaction, PurchaseOrder } from './entities/inventory.entity';
import { Employee, Expense } from './entities/employee.entity';
import { CaClient, ItrRecord, ClientDocument, ReconciliationRecord } from './entities/ca.entity';
import { MembershipPlan, MembershipSubscription, LoyaltyAccount, LoyaltyTransaction } from './entities/loyalty.entity';
import { Coupon, CouponUsage } from './entities/coupon.entity';
import { NotificationTemplate, NotificationLog } from './entities/notification.entity';
import { AttendanceRecord, Shift, LeaveRequest } from './entities/attendance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'laundry_ms'),
        entities: [
          Organization, Branch, User, Customer,
          Service, ServicePriceList,
          Order, OrderItem, OrderStatusHistory,
          Garment, ProcessingBatch, QualityInspection,
          Invoice, Payment, JournalEntry,
          Vendor, InventoryItem, InventoryTransaction, PurchaseOrder,
          Employee, Expense,
          CaClient, ItrRecord, ClientDocument, ReconciliationRecord,
          MembershipPlan, MembershipSubscription, LoyaltyAccount, LoyaltyTransaction,
          Coupon, CouponUsage,
          NotificationTemplate, NotificationLog,
          AttendanceRecord, Shift, LeaveRequest,
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true' && configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 300 },
    ]),

    AuthModule,
    OrdersModule,
    CustomersModule,
    CaModule,
    ServicesModule,
    BillingModule,
    InventoryModule,
    ExpensesModule,
    EmployeesModule,
    ReportsModule,
    GarmentsModule,
    BranchesModule,
    LoyaltyModule,
    CouponsModule,
    NotificationsModule,
    AttendanceModule,
    DeliveryModule,
    PlatformModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
