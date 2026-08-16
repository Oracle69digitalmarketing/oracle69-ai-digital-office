import { MessageBus, TenantContextService } from "@oracle69/runtime";
export declare class CrmAiService {
  private readonly messageBus;
  private readonly tenantContext;
  private readonly logger;
  private prisma;
  private genAI?;
  private groqApiKey?;
  constructor(messageBus: MessageBus, tenantContext: TenantContextService);
  private generate;
  scoreLead(leadId: string): Promise<any>;
  predictOpportunityProbability(opportunityId: string): Promise<any>;
  summarizeActivity(activityId: string): Promise<any>;
}
//# sourceMappingURL=crm-ai.service.d.ts.map
