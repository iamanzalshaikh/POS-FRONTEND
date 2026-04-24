import api from "./api";

export interface Supplier {
  id: string;
  storeId: string;
  name: string;
  phone: string | null;
  address: string | null;
  companyName?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalBalance?: number;
  supplierPayable?: number;
  supplierPaid?: number;
  _count?: { purchases: number };
}

export interface SupplierPurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  batchId?: string | null;
  product?: { 
    id: string; 
    name: string; 
    sku: string; 
    barcode: string;
    unitType?: string;
  };
  batch?: { id: string; batchNumber: string | null; quantityRemaining?: number };
}

export interface SupplierPurchase {
  id: string;
  storeId: string;
  supplierId: string;
  userId: string | null;
  purchaseDate: string;
  totalAmount: string | number;
  paidAmount: string | number;
  balance: string | number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  boughtQty?: number;
  returnQty?: number;
  returnAmount?: number;
  supplier?: { id: string; name: string; phone?: string | null };
  user?: { id: string; name: string; email: string };
  store?: {
    id: string;
    name: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    taxNtn?: string | null;
    taxStrn?: string | null;
  };
  items?: SupplierPurchaseItem[];
  payments?: SupplierPurchasePayment[];
  _count?: { items: number; payments: number };
}

export interface SupplierPurchasePayment {
  id: string;
  storeId: string;
  purchaseId: string;
  supplierId: string;
  paymentDate: string;
  amount: string | number;
  method: "CASH" | "BANK" | "CHEQUE";
  notes: string | null;
  createdAt: string;
  purchase?: {
    id: string;
    purchaseDate: string;
    totalAmount: string | number;
    balance: string | number;
  };
}

export const getSuppliers = (params?: { activeOnly?: boolean }) =>
  api.get<{ success: boolean; data: Supplier[] }>("/suppliers", {
    params: params?.activeOnly === false ? { activeOnly: "false" } : undefined,
  });

export const getSupplier = (id: string) =>
  api.get<{ success: boolean; data: Supplier }>(`/suppliers/${id}`);

export const createSupplier = (body: {
  name: string;
  companyName?: string;
  phone?: string;
  address?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
}) =>
  api.post<{ success: boolean; data: Supplier }>("/suppliers", body);

export const updateSupplier = (
  id: string,
  body: Partial<{
    name: string;
    companyName: string;
    phone: string;
    address: string;
    addressLine: string;
    city: string;
    state: string;
    country: string;
    isActive: boolean;
  }>
) => api.patch<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, body);

export interface CreatePurchaseLine {
  productId: string;
  quantity: number;
  unitPrice?: number;
  purchaseCost?: number;
  sellingPrice?: number;
  gstPercentage?: number;
  lineDiscount?: number;
  initialStock?: number;
  alertAt?: number;
}

export const createSupplierPurchase = (body: {
  supplierId: string;
  purchaseDate: string;
  items: CreatePurchaseLine[];
  paidAmount?: number;
  notes?: string;
}) => api.post<{ success: boolean; data: SupplierPurchase }>("/supplier-purchases", body);

export const getSupplierPurchases = (params?: { page?: number; limit?: number; supplierId?: string; isOpeningStock?: boolean }) =>
  api.get<{
    success: boolean;
    data: { items: SupplierPurchase[]; total: number; page: number; limit: number };
  }>("/supplier-purchases", { params });

export const getSupplierPurchase = (id: string) =>
  api.get<{ success: boolean; data: SupplierPurchase }>(`/supplier-purchases/${id}`);

export const getPurchasesBySupplier = (supplierId: string) =>
  api.get<{ success: boolean; data: SupplierPurchase[] }>(
    `/supplier-purchases/supplier/${supplierId}`
  );

export const createSupplierPayment = (body: {
  purchaseId: string;
  amount: number;
  paymentDate: string;
  method: "CASH" | "BANK" | "CHEQUE" | "BANK_TRANSFER";
  notes?: string;
}) =>
  api.post<{
    success: boolean;
    data: { payment: SupplierPurchasePayment; purchase: Pick<SupplierPurchase, "id" | "paidAmount" | "balance" | "totalAmount"> };
  }>("/supplier-payments", body);

export const getPaymentsByPurchase = (purchaseId: string) =>
  api.get<{ success: boolean; data: SupplierPurchasePayment[] }>(
    `/supplier-payments/purchase/${purchaseId}`
  );

export const getPaymentsBySupplier = (supplierId: string) =>
  api.get<{ success: boolean; data: SupplierPurchasePayment[] }>(
    `/supplier-payments/supplier/${supplierId}`
  );
