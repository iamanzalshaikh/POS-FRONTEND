import axios from "../service/api";

export const fetchDailySales = () => {
  return axios.get("/sales/daily");
};

export const fetchWeeklyRevenue = () => {
  return axios.get("/sales/weekly");
};

export const createSale = (payload: any, idempotencyKey: string) => {
  return axios.post("/sales", payload, {
    headers: {
      "x-idempotency-key": idempotencyKey,
    },
  });
};

export const getSaleById = (saleId: string) => {
  return axios.get(`/sales/${saleId}`);
};

export const syncOfflineSales = (payload: { batchId: string; deviceId: string; sales: any[] }) => {
  return axios.post("/sync/sales", payload);
};

export const getSalesTransactions = (params?: any) => {
  return axios.get("/sales", { params });
};

// getSaleById already exists above, updating slightly just in case
// export const getSaleById = (saleId: string) => { return axios.get(`/sales/${saleId}`); };

export const cancelSale = (id: string, reason: string) => {
  return axios.patch(`/sales/${id}/cancel`, { reason });
};

export const refundSale = (id: string, reason: string) => {
  return axios.post(`/sales/${id}/refund`, { reason });
};
