import api from "./api";

export const fetchLowStockInventory = (params?: { limit?: number; page?: number }) => {
  return api.get("/inventory?lowStock=true", { params }).then(res => res.data);
};

export const fetchFullInventory = (params?: { limit?: number; page?: number }) => {
  return api.get("/inventory", { params }).then(res => res.data);
};

export const fetchInventoryLogs = (params?: { productId?: string; changeType?: string; limit?: number; page?: number }) => {
  return api.get("/inventory/logs", { params }).then(res => res.data);
};

export const adjustStock = (data: {
  productId: string;
  changeType: string;
  quantity: number;
  notes?: string;
  referenceId?: string;
  supplierId?: string;
  batchId?: string;
}) => {
  return api.post("/inventory/adjust", data).then(res => res.data);
};

export const recordOpeningStock = (data: {
  items: Array<{
    productId: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice?: number;
    taxPercentage?: number;
    discountPercentage?: number;
  }>;
  notes?: string;
  purchaseDate?: string;
}) => {
  return api.post("/inventory/opening-stock", data).then(res => res.data);
};
