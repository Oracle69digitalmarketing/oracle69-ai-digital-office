import { Module } from '@nestjs/common';
import { RuntimeModule } from '@oracle69/runtime';

@Module({
  imports: [RuntimeModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProcurementIntelligenceModule {}
