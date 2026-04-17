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
  search?: string;
}

export interface InventoryLogsParams {
  page?: number;
  limit?: number;
  changeType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ProfitLossData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  salaries: number;
  salariesSource: 'PAYROLL' | 'EXPENSES' | 'NONE';
  expenseRatio: number;
  netProfit: number;
  netMargin: number;
  expenseByCategory: Record<string, number>;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalSales: number;
    totalExpenses: number;
    expenseEntryCount: number;
  };
}

/** GET /finance/summary — same shape as GET /reports/finance/summary */
export interface FinanceSummaryData {
  period: { startDate: string; endDate: string };
  comparisonPeriod: { startDate: string; endDate: string };
  totalRevenue: number;
  cogs: number;
  operatingExpenses: number;
  salaries: number;
  salariesSource: 'PAYROLL' | 'EXPENSES' | 'NONE';
  totalExpenses: number;
  grossProfit: number;
  grossMarginPercent: number | null;
  netProfit: number;
  taxLiability: number;
  totalStockProcurement: number;
  totalStockPaid: number;
  outstandingPayables: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

export interface MonthlyCloseData {
  period: {
    startDate: string;
    endDate: string;
    year: number;
    month: number;
  };
  sales: {
    totalRevenue: number;
    totalTransactions: number;
    totalDiscount: number;
    totalTax: number;
    netRevenue: number;
  };
  expenses: {
    total: number;
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  cogs: number;
  profit: {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockValuation: number;
  };
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
  /** Present on GET /sales — use for GST when header totalTax is 0 */
  saleItems?: Array<{ tax?: number | string; subtotal?: number | string }>;
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
    () => api.get<BackendApiResponse<SalesTransaction[]>>('/sales', { 
      params: {
        ...params,
        search: params?.search
      } 
    }),
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
    () => api.get<BackendApiResponse<InventoryLogsData>>('/inventory/logs', { 
      params: {
        ...params,
        search: params?.search
      }
    }),
    'Failed to fetch inventory logs'
  );
};

// ============================================================================
// FINANCE REPORTS (NEW - Correct COGS Calculation)
// Endpoint: GET /finance/*
// Access: ACCOUNTANT, STORE_ADMIN, SUPER_ADMIN
// ============================================================================

/**
 * Finance dashboard summary (revenue, COGS, opex, salaries, net profit, tax, period-over-period %).
 * Optional `startDate` + `endDate` (YYYY-MM-DD); omit both for last 30 days.
 */
export const getFinanceSummary = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<StandardApiResponse<FinanceSummaryData> | ApiError> => {
  return withErrorHandling(
    () =>
      api.get<BackendApiResponse<FinanceSummaryData>>('/finance/summary', {
        params:
          params?.startDate && params?.endDate
            ? { startDate: params.startDate, endDate: params.endDate }
            : undefined,
      }),
    'Failed to fetch finance summary'
  );
};

/**
 * Fetches Profit & Loss statement with correct COGS calculation
 * COGS = SUM(cost_price × quantity_sold) - NOT total inventory value
 */
export const getProfitAndLoss = async (params: SalesReportParams): Promise<StandardApiResponse<ProfitLossData> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<ProfitLossData>>('/finance/profit-loss', { params }),
    'Failed to fetch P&L statement'
  );
};

/**
 * Fetches Monthly Close report with correct COGS
 */
export const getMonthlyCloseReport = async (year: number, month: number): Promise<StandardApiResponse<MonthlyCloseData> | ApiError> => {
  return withErrorHandling(
    () => api.get<BackendApiResponse<MonthlyCloseData>>('/finance/monthly-close', { 
      params: { year, month } 
    }),
    'Failed to fetch monthly close report'
  );
};

/**
 * Fetches expenses grouped by category
 */
export const getFinanceExpensesByCategory = async (params: SalesReportParams): Promise<StandardApiResponse<any> | ApiError> => {
  return withErrorHandling(
    () => api.get('/finance/expenses-by-category', { params }),
    'Failed to fetch expenses by category'
  );
};

/**
 * Fetches monthly expense trend
 */
export const getFinanceExpensesTrend = async (months?: number): Promise<StandardApiResponse<any> | ApiError> => {
  return withErrorHandling(
    () => api.get('/finance/expenses-trend', { params: { months: months || 12 } }),
    'Failed to fetch expense trend'
  );
};

// ============================================================================
// RECENT TRANSACTIONS (sales & refunds)
// Endpoint: GET /finance/recent-transactions
// ============================================================================

export interface RecentFinanceTransaction {
  id: string;
  transactionType: 'SALE' | 'REFUND';
  invoiceNumber: string;
  offlineInvoiceNumber?: string | null;
  subtotal: number;
  discountAmount: number;
  totalTax: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  isReversal: boolean;
  linkedSaleId?: string | null;
  refundSaleId?: string | null;
  isOffline: boolean;
  createdAt: string;
  cashier: { id: string; name: string } | null;
  device: { id: string; deviceName: string } | null;
  lineItemCount: number;
}

export interface RecentTransactionsData {
  items: RecentFinanceTransaction[];
  filters: { type: string };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getRecentTransactions = async (params?: {
  type?: 'all' | 'sale' | 'refund';
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<StandardApiResponse<RecentTransactionsData> | ApiError> => {
  return withErrorHandling(
    () =>
      api.get<BackendApiResponse<RecentTransactionsData>>('/finance/recent-transactions', {
        params: {
          type: params?.type ?? 'all',
          page: params?.page ?? 1,
          limit: params?.limit ?? 30,
          search: params?.search,
          ...(params?.startDate && params?.endDate
            ? { startDate: params.startDate, endDate: params.endDate }
            : {}),
        },
      }),
    'Failed to fetch recent transactions'
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
