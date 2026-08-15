import { Module } from '@nestjs/common';
import { EnterpriseIntelligenceModule } from '@oracle69/enterprise-intelligence';
import { EiController } from './ei.controller.js';

@Module({
  imports: [EnterpriseIntelligenceModule],
  controllers: [EiController],
})
export class EiModule {}
