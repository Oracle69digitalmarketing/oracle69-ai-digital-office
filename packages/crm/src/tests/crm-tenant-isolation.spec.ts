import { jest } from "@jest/globals";
import { CrmContactService } from "../services/crm-contact.service.js";
import { CrmContactRepository } from "../repositories/crm-contact.repository.js";
import { MessageBus, TenantContextService } from "@oracle69/runtime";

describe("CrmTenantIsolation", () => {
  let service: CrmContactService;
  let repository: jest.Mocked<CrmContactRepository>;
  let messageBus: jest.Mocked<MessageBus>;
  let tenantContext: jest.Mocked<TenantContextService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
    } as any;

    messageBus = {
      publish: jest.fn(),
    } as any;

    tenantContext = {
      resolveTenantId: jest.fn(),
    } as any;

    service = new CrmContactService(repository, messageBus, tenantContext);
  });

  it("should only allow access to TenantA records when TenantA is active", async () => {
    const tenantA = "tenant-a";
    const tenantB = "tenant-b";

    // Mock the tenant resolution
    tenantContext.resolveTenantId.mockReturnValue(tenantA);

    // Mock repository to return different results based on tenantId
    repository.findAll.mockImplementation(async (tenantId) => {
      if (tenantId === tenantA) return [{ id: "a1", organizationId: tenantA } as any];
      return [];
    });

    const result = await service.listContacts();

    expect(tenantContext.resolveTenantId).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].organizationId).toBe(tenantA);
  });

  it("should throw error when trying to update a record that does not belong to the current tenant", async () => {
    const tenantA = "tenant-a";
    const tenantB = "tenant-b";

    tenantContext.resolveTenantId.mockReturnValue(tenantA);

    // Simulate repository access denial (repository throws if organizationId doesn't match for the record)
    repository.update.mockImplementation(async (id, organizationId, data) => {
      // Mocked ownership check: simulate that record 'b1' belongs to tenantB, not tenantA
      if (id === "b1" && organizationId !== "tenant-b")
        throw new Error("Not found or access denied");
      if (organizationId !== tenantA) throw new Error("Not found or access denied");
      return { id, organizationId, ...data } as any;
    });

    await expect(service.updateContact("a1", { firstName: "New" } as any)).resolves.toBeDefined();
    await expect(service.updateContact("b1", { firstName: "New" } as any)).rejects.toThrow(
      "Not found or access denied",
    );
  });
});
