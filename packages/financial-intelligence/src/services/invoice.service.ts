import { Inject, Injectable } from '@nestjs/common';
import { INVOICE_REPOSITORY, type InvoiceRepository } from '../repositories/invoice.repository.js';
import { TransactionService } from './transaction.service.js';
import { FinInvoice, InvoiceStatus, TransactionType, TransactionStatus } from '../types.js';
import { EventBus, TenantContextService } from '@oracle69/runtime';
import { FinancialEventType } from '../events/financial.events.js';

const EVENT_SOURCE = 'financial-intelligence';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepo: InvoiceRepository,
    private readonly transactionService: TransactionService,
    private readonly eventBus: EventBus,
    private readonly tenantContext: TenantContextService,
  ) {}

  async createInvoice(invoice: Omit<FinInvoice, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'> & { organizationId?: string }): Promise<FinInvoice> {
    const tenantId = this.tenantContext.resolveTenantId(invoice.organizationId);
    const created = await this.invoiceRepo.create({ ...invoice, organizationId: tenantId });
    await this.eventBus.publish(FinancialEventType.INVOICE_CREATED, created, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return created;
  }

  async sendInvoice(id: string, organizationId?: string): Promise<FinInvoice> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const invoice = await this.requireInvoice(id, tenantId);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error(`Cannot send invoice ${id} in status ${invoice.status}`);
    }
    return this.invoiceRepo.update(id, { status: InvoiceStatus.SENT });
  }

  async markAsPaid(id: string, organizationId?: string): Promise<FinInvoice> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const invoice = await this.requireInvoice(id, tenantId);
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new Error(`Cannot mark cancelled invoice ${id} as paid`);
    }
    if (invoice.status === InvoiceStatus.PAID) return invoice;

    const updated = await this.invoiceRepo.update(id, { status: InvoiceStatus.PAID });

    // Paid invoices integrate into financial transactions as income.
    await this.transactionService.recordTransaction({
      type: TransactionType.INCOME,
      category: 'Invoice Payment',
      amount: invoice.amount,
      date: new Date().toISOString(),
      status: TransactionStatus.COMPLETED,
      description: `Payment for invoice ${invoice.number}`,
      organizationId: tenantId,
      invoiceId: id,
    });

    await this.eventBus.publish(FinancialEventType.INVOICE_PAID, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });

    return updated;
  }

  async cancelInvoice(id: string, organizationId?: string): Promise<FinInvoice> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    const invoice = await this.requireInvoice(id, tenantId);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error(`Cannot cancel paid invoice ${id}`);
    }
    if (invoice.status === InvoiceStatus.CANCELLED) return invoice;
    const updated = await this.invoiceRepo.update(id, { status: InvoiceStatus.CANCELLED });
    await this.eventBus.publish(FinancialEventType.INVOICE_CANCELLED, updated, {
      tenantId,
      source: EVENT_SOURCE,
    });
    return updated;
  }

  async getInvoices(organizationId?: string, status?: InvoiceStatus): Promise<FinInvoice[]> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.invoiceRepo.findByOrganization(tenantId, status);
  }

  async findById(id: string, organizationId?: string): Promise<FinInvoice | null> {
    const tenantId = this.tenantContext.resolveTenantId(organizationId);
    return this.invoiceRepo.findById(id, tenantId);
  }

  private async requireInvoice(id: string, tenantId: string): Promise<FinInvoice> {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }
}
