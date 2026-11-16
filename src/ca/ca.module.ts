import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { CaClient, ItrRecord, ClientDocument, ReconciliationRecord } from '../entities/ca.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaClient, ItrRecord, ClientDocument, ReconciliationRecord]),
  ],
  controllers: [CaController],
  providers: [CaService],
  exports: [CaService],
})
export class CaModule {}
