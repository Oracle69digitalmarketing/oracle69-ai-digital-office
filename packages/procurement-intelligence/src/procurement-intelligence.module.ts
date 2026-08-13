import { Module } from '@nestjs/common';
import { RuntimeModule } from '@oracle69/runtime';
import { ProcurementController } from './controllers/procurement.controller.js';
import { ProcurementService } from './services/procurement.service.js';
import { PrismaSupplierRepository, SUPPLIER_REPOSITORY } from './repositories/supplier.repository.js';
import { PrismaPurchaseOrderRepository, PURCHASE_ORDER_REPOSITORY } from './repositories/purchase-order.repository.js';

@Module({
  imports: [RuntimeModule],
  controllers: [ProcurementController],
  providers: [
    ProcurementService,
    { provide: SUPPLIER_REPOSITORY, useClass: PrismaSupplierRepository },
    { provide: PURCHASE_ORDER_REPOSITORY, useClass: PrismaPurchaseOrderRepository },
  ],
  exports: [ProcurementService],
})
export class ProcurementIntelligenceModule {}
