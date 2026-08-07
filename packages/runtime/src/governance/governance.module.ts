import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine } from './governance-engine.js';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
  exports: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
})
export class GovernanceModule {}
