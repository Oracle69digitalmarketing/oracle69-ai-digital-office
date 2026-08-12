export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  category: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
