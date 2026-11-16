import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Branch } from '../entities/branch.entity';
import { Order } from '../entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Branch, Order]),
    JwtModule.register({}),
  ],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}
