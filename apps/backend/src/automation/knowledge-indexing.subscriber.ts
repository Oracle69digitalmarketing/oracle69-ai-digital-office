import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBus } from '@oracle69/runtime';
import { EnterpriseIntelligenceEventType } from '@oracle69/enterprise-intelligence';
import { IndexService } from '@oracle69/knowledge-intelligence';

@Injectable()
export class KnowledgeIndexingSubscriber implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeIndexingSubscriber.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly indexService: IndexService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(EnterpriseIntelligenceEventType.REPORT_GENERATED, async (event) => {
      const organizationId = event.metadata.tenantId;
      if (!organizationId) {
        this.logger.warn('Received REPORT_GENERATED event without tenantId');
        return;
      }
      this.logger.log(`Indexing knowledge for organization ${organizationId} following EI report generation`);
      try {
        await this.indexService.reindexAll(organizationId);
      } catch (err) {
        this.logger.error(`Failed to reindex knowledge for ${organizationId}`, err);
      }
    });
  }
}
