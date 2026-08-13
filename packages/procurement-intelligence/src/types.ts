export interface Supplier {
  id: string;
  name: string;
  category: string | null;
  status: string;
  contactEmail: string;
  organizationId: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  amount: number;
  status: string;
  organizationId: string;
}
