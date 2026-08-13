import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementService } from '../services/procurement.service.js';
import { SUPPLIER_REPOSITORY } from '../repositories/supplier.repository.js';
import { PURCHASE_ORDER_REPOSITORY } from '../repositories/purchase-order.repository.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let mockSupplierRepo: any;
  let mockPoRepo: any;
  let mockEventBus: any;
  let mockTenantContext: any;

  beforeEach(async () => {
    mockSupplierRepo = { create: jest.fn(), findById: jest.fn(), findByOrganization: jest.fn() };
    mockPoRepo = { create: jest.fn(), findById: jest.fn(), findByOrganization: jest.fn(), update: jest.fn() };
    mockEventBus = { publish: jest.fn() };
    mockTenantContext = { resolveTenantId: jest.fn((id) => id || 'test-org') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcurementService,
        { provide: SUPPLIER_REPOSITORY, useValue: mockSupplierRepo },
        { provide: PURCHASE_ORDER_REPOSITORY, useValue: mockPoRepo },
        { provide: EventBus, useValue: mockEventBus },
        { provide: TenantContextService, useValue: mockTenantContext },
      ],
    }).compile();

    service = module.get<ProcurementService>(ProcurementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a supplier', async () => {
    const supplier = { name: 'Test Supplier', category: 'IT', contactEmail: 'test@supplier.com', status: 'active', organizationId: 'test-org' };
    mockSupplierRepo.create.mockResolvedValue({ id: 's1', ...supplier });
    const result = await service.createSupplier(supplier);
    expect(result.id).toBe('s1');
    expect(mockEventBus.publish).toHaveBeenCalled();
  });
});
