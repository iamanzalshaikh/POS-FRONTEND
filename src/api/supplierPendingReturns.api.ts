import api from "./api";

export interface SupplierPendingReturn {
  id: string;
  storeId: string;
  supplierId: string;
  productId: string;
  quantity: number;
  purchasePrice: number;
  totalAmount: number;
  status: 'PENDING' | 'RESOLVED';
  notes?: string;
  resolvedAt?: string;
  resolutionType?: 'STOCK_ADJUST_IN' | 'CREDIT_AMOUNT';
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; name: string };
  product: { id: string; name: string; sku: string; barcode: string };
}

export const fetchPendingReturns = (params?: { supplierId?: string; status?: string }) => {
  return api.get("/supplier-pending-returns", { params }).then(res => res.data);
};

export const resolvePendingReturn = (id: string, data: { resolutionType: 'STOCK_ADJUST_IN' | 'CREDIT_AMOUNT'; notes?: string }) => {
  return api.post(`/supplier-pending-returns/${id}/resolve`, data).then(res => res.data);
};
