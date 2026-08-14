import { Module, OnModuleInit } from '@nestjs/common';
import { RuntimeModule, EventCatalogService, EventCategory } from '@oracle69/runtime';
import { ProcurementController } from './controllers/procurement.controller.js';
import { ProcurementService } from './services/procurement.service.js';
import { ProcurementKpiEngine } from './services/procurement-kpi.engine.js';
import { ProcurementHealthEngine } from './services/procurement-health.engine.js';
import { ProcurementInsightService } from './services/procurement-insight.service.js';
import { PrismaSupplierRepository, SUPPLIER_REPOSITORY } from './repositories/supplier.repository.js';
import { PrismaPurchaseOrderRepository, PURCHASE_ORDER_REPOSITORY } from './repositories/purchase-order.repository.js';
import { ProcurementEventType } from './events/procurement.events.js';

@Module({
  imports: [RuntimeModule],
  controllers: [ProcurementController],
  providers: [
    ProcurementService,
    ProcurementKpiEngine,
    ProcurementHealthEngine,
    ProcurementInsightService,
    { provide: SUPPLIER_REPOSITORY, useClass: PrismaSupplierRepository },
    { provide: PURCHASE_ORDER_REPOSITORY, useClass: PrismaPurchaseOrderRepository },
  ],
  exports: [ProcurementService, ProcurementKpiEngine, ProcurementHealthEngine, ProcurementInsightService],
})
export class ProcurementIntelligenceModule implements OnModuleInit {
  constructor(private readonly eventCatalog: EventCatalogService) {}

  onModuleInit() {
    this.eventCatalog.registerDomainType(ProcurementEventType.HEALTH_UPDATED, 'Procurement health updated.', EventCategory.EXECUTIVE);
    this.eventCatalog.registerDomainType(ProcurementEventType.INSIGHT_GENERATED, 'Procurement insight generated.', EventCategory.EXECUTIVE);
  }
}
