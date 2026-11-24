import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GarmentsController } from './garments.controller';
import { GarmentsService } from './garments.service';
import { Garment, ProcessingBatch, QualityInspection } from '../entities/garment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Garment, ProcessingBatch, QualityInspection])],
  controllers: [GarmentsController],
  providers: [GarmentsService],
  exports: [GarmentsService],
})
export class GarmentsModule {}
