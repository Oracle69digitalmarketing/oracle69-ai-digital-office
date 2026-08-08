export declare class PolicyEngine {
    evaluate(policyId: string, context: any): Promise<boolean>;
}
export declare class ApprovalEngine {
    requestApproval(requestId: string, role: string): Promise<void>;
}
export declare class ComplianceEngine {
    validate(data: any): Promise<boolean>;
}
export declare class AuditEngine {
    record(action: string, actor: string, details: any): Promise<void>;
}
export declare class RiskEngine {
    detect(data: any): Promise<boolean>;
}
export declare class GovernanceEngine {
    private readonly policy;
    private readonly audit;
    private readonly logger;
    constructor(policy: PolicyEngine, audit: AuditEngine);
    enforce(policyId: string, context: any): Promise<void>;
}
//# sourceMappingURL=governance-engine.d.ts.map