import { Module } from '@nestjs/common';
import { GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine } from './governance-engine.js';

@Module({
  providers: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
  exports: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
})
export class GovernanceModule {}
