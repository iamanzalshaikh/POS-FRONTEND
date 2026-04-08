/**
 * Offline Sync API
 * API functions for syncing offline sales
 */

import api from '../service/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Sync offline sales to the server
 */
export const syncOfflineSales = async (
  batchId: string,
  deviceId: string,
  sales: Array<{
    saleId: string;
    invoiceNumber: string;
    deviceId: string;
    paymentMethod: string;
    discountAmount: number;
    notes?: string;
    items: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      price: number;
    }>;
    totals: {
      subtotal: number;
      tax: number;
      total: number;
    };
    offlineCreatedAt: string;
    idempotencyKey: string;
  }>
) => {
  return api.post('/sync/sales', {
    batchId,
    deviceId,
    sales,
  });
};

/**
 * Get sync status
 */
export const getSyncStatus = async () => {
  return api.get('/sync/status');
};
