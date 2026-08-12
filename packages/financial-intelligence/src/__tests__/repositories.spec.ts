import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { PrismaTransactionRepository } from '../repositories/transaction.repository.js';
import { PrismaBudgetRepository } from '../repositories/budget.repository.js';
import { PrismaInvoiceRepository } from '../repositories/invoice.repository.js';
import { BudgetPeriod, BudgetStatus, InvoiceStatus, TransactionStatus, TransactionType } from '../types.js';

function mockPrisma() {
  return {
    finTransaction: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    finBudget: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    finInvoice: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  } as any;
}

describe('Prisma financial repositories', () => {
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
  });

  it('should scope transaction reads by organization', async () => {
    prisma.finTransaction.findMany.mockResolvedValue([]);
    const repo = new PrismaTransactionRepository(prisma);

    await repo.findByOrganization('org-1', { type: TransactionType.INCOME, status: TransactionStatus.COMPLETED });

    expect(prisma.finTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          type: TransactionType.INCOME,
          status: TransactionStatus.COMPLETED,
        }),
      }),
    );
  });

  it('should reject cross-tenant transaction reads by id', async () => {
    prisma.finTransaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      organizationId: 'org-a',
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaTransactionRepository(prisma);

    expect(await repo.findById('tx-1', 'org-b')).toBeNull();
    expect(await repo.findById('tx-1', 'org-a')).not.toBeNull();
  });

  it('should scope budget reads by organization and status', async () => {
    prisma.finBudget.findMany.mockResolvedValue([]);
    const repo = new PrismaBudgetRepository(prisma);

    await repo.findByOrganization('org-1', BudgetStatus.ACTIVE);

    expect(prisma.finBudget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', status: BudgetStatus.ACTIVE }),
      }),
    );
  });

  it('should reject cross-tenant budget reads by id', async () => {
    prisma.finBudget.findUnique.mockResolvedValue({
      id: 'budget-1',
      organizationId: 'org-a',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaBudgetRepository(prisma);

    expect(await repo.findById('budget-1', 'org-b')).toBeNull();
  });

  it('should scope invoice reads by organization and status', async () => {
    prisma.finInvoice.findMany.mockResolvedValue([]);
    const repo = new PrismaInvoiceRepository(prisma);

    await repo.findByOrganization('org-1', InvoiceStatus.PAID);

    expect(prisma.finInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1', status: InvoiceStatus.PAID }),
      }),
    );
  });

  it('should reject cross-tenant invoice reads by id', async () => {
    prisma.finInvoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      organizationId: 'org-a',
      dueDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaInvoiceRepository(prisma);

    expect(await repo.findById('inv-1', 'org-b')).toBeNull();
  });

  it('should persist a transaction with parsed dates', async () => {
    prisma.finTransaction.create.mockResolvedValue({
      id: 'tx-new',
      organizationId: 'org-1',
      date: new Date('2026-08-01T00:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaTransactionRepository(prisma);

    const created = await repo.create({
      type: TransactionType.INCOME,
      category: 'Sales',
      amount: 500,
      date: '2026-08-01T00:00:00.000Z',
      status: TransactionStatus.COMPLETED,
      organizationId: 'org-1',
    });

    expect(created.amount).toBe(500);
    expect(prisma.finTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ date: new Date('2026-08-01T00:00:00.000Z') }),
    });
  });
});
