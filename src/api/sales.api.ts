import api from "./api";

// Use reports API for these as the backend /sales routes don't exist for daily/weekly in some versions
export const fetchDailySales = (params?: { startDate: string; endDate: string }) => {
  return api.get("/reports/sales", { params }).then(res => res.data);
};

export const fetchWeeklyRevenue = (params?: { startDate: string; endDate: string }) => {
  return api.get("/reports/sales", { params }).then(res => res.data);
};

export const createSale = (payload: any, idempotencyKey: string) => {
  return api.post("/sales", payload, {
    headers: {
      "x-idempotency-key": idempotencyKey,
    },
  }).then(res => res.data);
};

export const getSaleById = (saleId: string) => {
  return api.get(`/sales/${saleId}`).then(res => res.data);
};

export const getSaleReceipt = (saleId: string) => {
  return api.get(`/sales/${saleId}/receipt`).then(res => res.data);
};

export const getSaleByInvoiceNumber = (invoiceNumber: string) => {
  const encodedInvoiceNumber = encodeURIComponent(invoiceNumber);
  return api.get(`/sales/invoice/${encodedInvoiceNumber}`).then(res => res.data);
};

export const syncOfflineSales = (payload: { batchId: string; deviceId: string; sales: any[] }) => {
  return api.post("/sync/sales", payload).then(res => res.data);
};

export const getSalesTransactions = (params?: any) => {
  return api.get("/sales", { params }).then(res => res.data);
};

export const cancelSale = (id: string, reason: string) => {
  return api.patch(`/sales/${id}/cancel`, { reason }).then(res => res.data);
};

export const refundSale = (id: string, reason: string, items?: { productId: string, quantity: number }[]) => {
  return api.post(`/sales/${id}/refund`, { reason, items }).then(res => res.data);
};
