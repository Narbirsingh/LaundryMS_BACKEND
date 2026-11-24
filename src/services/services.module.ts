import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service, ServicePriceList } from '../entities/service.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServicePriceList])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
