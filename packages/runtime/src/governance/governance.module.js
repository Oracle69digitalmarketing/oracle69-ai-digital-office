var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine } from './governance-engine.js';
let GovernanceModule = class GovernanceModule {
};
GovernanceModule = __decorate([
    Module({
        imports: [EventEmitterModule.forRoot()],
        providers: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
        exports: [GovernanceEngine, PolicyEngine, ApprovalEngine, ComplianceEngine, AuditEngine, RiskEngine],
    })
], GovernanceModule);
export { GovernanceModule };
//# sourceMappingURL=governance.module.js.map