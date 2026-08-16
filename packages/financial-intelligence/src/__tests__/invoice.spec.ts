import { describe, it, expect, beforeEach } from "@jest/globals";
import { createFinancialTestModule, FinancialTestContext } from "../testing/test-fixture.js";
import { InvoiceStatus } from "../types.js";

describe("Invoice lifecycle", () => {
  let ctx: FinancialTestContext;

  beforeEach(() => {
    ctx = createFinancialTestModule();
  });

  it("should follow draft -> sent -> paid", async () => {
    const orgId = "org-invoice-1";
    const invoice = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.createInvoice({
        number: "INV-100",
        amount: 300,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.invoiceService.sendInvoice(invoice.id);
      await ctx.invoiceService.markAsPaid(invoice.id);
    });

    const final = await ctx.invoiceService.findById(invoice.id, orgId);
    expect(final?.status).toBe(InvoiceStatus.PAID);
  });

  it("should not allow sending an already sent invoice", async () => {
    const orgId = "org-invoice-2";
    const invoice = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.createInvoice({
        number: "INV-101",
        amount: 300,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.invoiceService.sendInvoice(invoice.id);
      await expect(ctx.invoiceService.sendInvoice(invoice.id)).rejects.toThrow(
        /Cannot send invoice/,
      );
    });
  });

  it("should not allow paying a cancelled invoice", async () => {
    const orgId = "org-invoice-3";
    const invoice = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.createInvoice({
        number: "INV-102",
        amount: 300,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.invoiceService.cancelInvoice(invoice.id);
      await expect(ctx.invoiceService.markAsPaid(invoice.id)).rejects.toThrow(/cancelled/);
    });
  });

  it("should not allow cancelling a paid invoice", async () => {
    const orgId = "org-invoice-4";
    const invoice = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.createInvoice({
        number: "INV-103",
        amount: 300,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.invoiceService.sendInvoice(invoice.id);
      await ctx.invoiceService.markAsPaid(invoice.id);
      await expect(ctx.invoiceService.cancelInvoice(invoice.id)).rejects.toThrow(/paid invoice/);
    });
  });

  it("should emit invoice.cancelled when an invoice is cancelled", async () => {
    const orgId = "org-invoice-5";
    const invoice = await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.createInvoice({
        number: "INV-104",
        amount: 300,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      }),
    );

    await ctx.tenantContext.runAsync({ tenantId: orgId }, () =>
      ctx.invoiceService.cancelInvoice(invoice.id),
    );

    const cancelledEvent = ctx.events.find((e) => e.type === "invoice.cancelled");
    expect(cancelledEvent).toBeDefined();
    expect(cancelledEvent?.tenantId).toBe(orgId);
    expect(cancelledEvent?.payload).toMatchObject({
      id: invoice.id,
      status: InvoiceStatus.CANCELLED,
    });
  });

  it("should filter invoices by status", async () => {
    const orgId = "org-invoice-6";
    await ctx.tenantContext.runAsync({ tenantId: orgId }, async () => {
      await ctx.invoiceService.createInvoice({
        number: "INV-200",
        amount: 100,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.DRAFT,
        clientId: "client-x",
      });
      await ctx.invoiceService.createInvoice({
        number: "INV-201",
        amount: 100,
        dueDate: "2026-09-01T00:00:00.000Z",
        status: InvoiceStatus.SENT,
        clientId: "client-x",
      });
    });

    const sent = await ctx.invoiceService.getInvoices(orgId, InvoiceStatus.SENT);
    expect(sent).toHaveLength(1);
    expect(sent[0].number).toBe("INV-201");
  });
});
