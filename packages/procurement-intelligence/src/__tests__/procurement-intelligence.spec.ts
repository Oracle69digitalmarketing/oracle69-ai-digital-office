import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { MessageBus } from '@oracle69/runtime';
import { ProcurementKpiEngine } from '../services/procurement-kpi.engine.js';
import { ProcurementHealthEngine } from '../services/procurement-health.engine.js';
import { ProcurementInsightService } from '../services/procurement-insight.service.js';
import { SUPPLIER_REPOSITORY } from '../repositories/supplier.repository.js';
import { PURCHASE_ORDER_REPOSITORY } from '../repositories/purchase-order.repository.js';

describe('Procurement Intelligence Engines', () => {
  let kpiEngine: ProcurementKpiEngine;
  let healthEngine: ProcurementHealthEngine;
  let insightService: ProcurementInsightService;
  let mockSupplierRepo: any;
  let mockPoRepo: any;
  let mockMessageBus: any;

  beforeEach(async () => {
    mockSupplierRepo = { findByOrganization: jest.fn().mockResolvedValue([{ id: 's1', name: 'Supplier A' }]) };
    mockPoRepo = { findByOrganization: jest.fn().mockResolvedValue([{ id: 'p1', supplierId: 's1', amount: 100, status: 'completed' }]) };
    mockMessageBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementKpiEngine,
        ProcurementHealthEngine,
        ProcurementInsightService,
        { provide: SUPPLIER_REPOSITORY, useValue: mockSupplierRepo },
        { provide: PURCHASE_ORDER_REPOSITORY, useValue: mockPoRepo },
        { provide: MessageBus, useValue: mockMessageBus },
      ],
    }).compile();

    kpiEngine = module.get(ProcurementKpiEngine);
    healthEngine = module.get(ProcurementHealthEngine);
    insightService = module.get(ProcurementInsightService);
  });

  it('should compute KPI metrics', async () => {
    const metrics = await kpiEngine.computeMetrics('org1');
    expect(metrics.totalSpend).toBe(100);
    expect(metrics.spendBySupplier['Supplier A']).toBe(100);
  });

  it('should assess health', async () => {
    const health = await healthEngine.assessHealth('org1');
    expect(health.status).toBe('healthy');
    expect(mockMessageBus.publish).toHaveBeenCalled();
  });

  it('should generate insights', async () => {
    const insight = await insightService.generateInsights('org1');
    expect(insight.summary).toBeDefined();
    expect(mockMessageBus.publish).toHaveBeenCalled();
  });
});
