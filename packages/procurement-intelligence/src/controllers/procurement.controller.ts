import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ProcurementService } from '../services/procurement.service.js';

@Controller('procurement/:organizationId')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  async createSupplier(@Param('organizationId') orgId: string, @Body() data: any) {
    return this.procurementService.createSupplier({ ...data, organizationId: orgId });
  }

  @Get('suppliers')
  async listSuppliers(@Param('organizationId') orgId: string) {
    return this.procurementService.listSuppliers(orgId);
  }

  @Post('purchase-orders')
  async createPurchaseOrder(@Param('organizationId') orgId: string, @Body() data: any) {
    return this.procurementService.createPurchaseOrder({ ...data, organizationId: orgId });
  }

  @Get('purchase-orders')
  async listPurchaseOrders(@Param('organizationId') orgId: string) {
    return this.procurementService.listPurchaseOrders(orgId);
  }

  @Patch('purchase-orders/:id')
  async updatePurchaseOrder(@Param('organizationId') orgId: string, @Param('id') id: string, @Body() data: any) {
    return this.procurementService.updatePurchaseOrder(id, { ...data, organizationId: orgId });
  }
}
