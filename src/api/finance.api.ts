import api from '../service/api';
import axios, { type AxiosResponse, type AxiosError } from 'axios';

/**
 * Finance Module API
 * 
 * All endpoints are accessible by ACCOUNTANT role.
 * Standardized response format for consistent handling.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Standardized API response format
 * All API functions return this consistent structure
 */
export interface StandardApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Backend API response structure (may vary)
 */
export interface BackendApiResponse<T = any> {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
}

// Request parameter interfaces
export interface SalesReportParams {
  startDate: string;
  endDate: string;
}

export interface SalesTransactionsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

export interface InventoryLogsParams {
  page?: number;
  limit?: number;
  changeType?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// DATA MODELS
// ============================================================================

export interface SalesReportData {
  data: Array<{
    date: string;
    transactions: number;
    revenue: number;
    discount: number;
    tax: number;
  }>;
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalDiscount: number;
    totalTax: number;
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

export interface SalesTransaction {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  totalTax: number;
  discountAmount: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  isCancelled: boolean;
  isReversal: boolean;
}

export interface SaleDetail {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  totalTax: number;
  discountAmount: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  saleItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

export interface InventoryReportData {
  summary: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockValue: number;
  };
  lowStock: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    reorderLevel: number;
  }>;
  outOfStock: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
  }>;
}

export interface InventoryLog {
  id: string;
  productId: string;
  product?: {
    name: string;
    sku: string;
  };
  changeType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'OPENING_STOCK';
  quantityChange: number;
  notes?: string;
  createdAt: string;
}

export interface InventoryLogsData {
  logs: InventoryLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
  originalError?: unknown;
}

/**
 * Centralized API error handler
 */
export const handleApiError = (error: unknown, context: string): ApiError => {
  const timestamp = new Date().toISOString();
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<BackendApiResponse>;
    const backendMessage = axiosError.response?.data?.message;
    const status = axiosError.response?.status;
    
    console.error(`[Finance API] ${context}:`, {
      timestamp,
      status,
      message: backendMessage || axiosError.message,
      url: (error as any).config?.url,
      method: (error as any).config?.method,
    });
    
    return {
      success: false,
      message: backendMessage || axiosError.message || 'Failed to fetch data',
      statusCode: status,
      originalError: error,
    };
  }
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  
  console.error(`[Finance API] ${context}:`, {
    timestamp,
    message: errorMessage,
  });
  
  return {
    success: false,
    message: errorMessage,
    originalError: error,
  };
};

// ============================================================================
// RESPONSE NORMALIZATION
// ============================================================================

/**
 * Normalizes backend responses to standard format
 * Handles various backend response structures
 * 
 * @param response - Axios response from backend
 * @param context - Context for error logging
 * @returns Standardized response with consistent structure
 */
export const normalizeResponse = <T>(
  response: AxiosResponse<BackendApiResponse<T>>,
  context: string
): StandardApiResponse<T> => {
  const backendData = response.data;
  
  // Handle different backend response structures
  let data: T;
  let success: boolean;
  let message: string | undefined;
  
  // Structure 1: { success: true, data: T, message: string }
  if (backendData && typeof backendData === 'object' && 'data' in backendData) {
    data = backendData.data as T;
    success = backendData.success ?? true;
    message = backendData.message;
  }
  // Structure 2: Direct data array (e.g., GET /sales returns array directly)
  else if (Array.isArray(backendData)) {
    data = backendData as unknown as T;
    success = true;
    message = undefined;
  }
  // Structure 3: Direct object data
  else if (backendData && typeof backendData === 'object') {
    data = backendData as T;
    success = true;
    message = undefined;
  }
  // Fallback
  else {
    data = backendData as T;
    success = true;
    message = undefined;
  }
  
  return {
    success,
    data,
    message,
  };
};

/**
 * Executes an API call with error handling and response normalization
 */
export const withErrorHandling = async <T,>(
  apiCall: () => Promise<AxiosResponse<BackendApiResponse<T>>>,
  context: string
): Promise<StandardApiResponse<T> | ApiError> => {
  try {
    const response = await apiCall();
    return normalizeResponse<T>(response, context);
  } catch (error) {
    return handleApiError(error, context);
  }
};

// ============================================================================
// SALES REPORTS
// Endpoint: GET /reports/sales
// Access: ACCOUNTANT, STORE_ADMIN, CASHIER
// ============================================================================

/**
 * Fetches sales report with aggregated data by date
 */
export const getSalesReport = async (params: SalesReportParams): Promise<StandardApiResponse<SalesReportData> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<SalesReportData>>('/reports/sales', { params }),
    'Failed to fetch sales report'
  );
};

// ============================================================================
// SALES TRANSACTIONS
// Endpoint: GET /sales
// Access: ACCOUNTANT, STORE_ADMIN, CASHIER
// ============================================================================

/**
 * Fetches individual sales transactions
 */
export const getSalesTransactions = async (params?: SalesTransactionsParams): Promise<StandardApiResponse<SalesTransaction[]> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<SalesTransaction[]>>('/sales', { params }),
    'Failed to fetch sales transactions'
  );
};

/**
 * Fetches a single sale by ID
 */
export const getSaleById = async (saleId: string): Promise<StandardApiResponse<SaleDetail> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<SaleDetail>>(`/sales/${saleId}`),
    `Failed to fetch sale ${saleId}`
  );
};

/**
 * Fetches a sale by invoice number
 */
export const getSaleByInvoiceNumber = async (invoiceNumber: string): Promise<StandardApiResponse<SaleDetail> | ApiError> => {
  const encodedInvoiceNumber = encodeURIComponent(invoiceNumber);
  
  return withErrorHandling(
    () => api.get<BackendApiResponse<SaleDetail>>(`/sales/invoice/${encodedInvoiceNumber}`),
    `Failed to fetch sale with invoice ${invoiceNumber}`
  );
};

// ============================================================================
// INVENTORY REPORTS
// Endpoint: GET /reports/inventory
// Access: ACCOUNTANT, STORE_ADMIN
// ============================================================================

/**
 * Fetches inventory report with stock levels and values
 */
export const getInventoryReport = async (): Promise<StandardApiResponse<InventoryReportData> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<InventoryReportData>>('/reports/inventory'),
    'Failed to fetch inventory report'
  );
};

// ============================================================================
// INVENTORY LOGS
// Endpoint: GET /inventory/logs
// Access: ACCOUNTANT, STORE_ADMIN
// ============================================================================

/**
 * Fetches inventory adjustment logs
 */
export const getInventoryLogs = async (params?: InventoryLogsParams): Promise<StandardApiResponse<InventoryLogsData> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<InventoryLogsData>>('/inventory/logs', { params }),
    'Failed to fetch inventory logs'
  );
};

// ============================================================================
// DEPRECATED / INACCESSIBLE FOR ACCOUNTANT
// ============================================================================

// The following endpoints require STORE_ADMIN or SUPER_ADMIN role
// and are not accessible to ACCOUNTANT users.

// export const getStoreDashboardData = async (params?: any) => {
//   return withErrorHandling(
//     () => api.get('/reports/storeadmin/dashboard', { params }),
//     'Failed to fetch dashboard data'
//   );
// };

// export const getAuditLogs = async (params?: any) => {
//   return withErrorHandling(
//     () => api.get('/reports/audit-logs', { params }),
//     'Failed to fetch audit logs'
//   );
// };
