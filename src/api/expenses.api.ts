import api from '../service/api';
import type { Expense } from '../utils/expense-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpensesApiResponse {
  success: boolean;
  data: Expense[];
  message?: string;
}

export interface CreateExpenseData {
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface ExpensesListResponse {
  items: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all expenses
 */
export const getExpenses = async (): Promise<ExpensesApiResponse> => {
  const response = await api.get<any>('/expenses');
  
  // Handle different response structures
  let data: Expense[];
  if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
    // Backend returns paginated response: { data: { items: [], pagination: {} } }
    data = response.data.data.items;
  } else if (Array.isArray(response.data)) {
    data = response.data;
  } else if (response.data?.data && Array.isArray(response.data.data)) {
    data = response.data.data;
  } else {
    data = [];
  }
  
  return {
    success: true,
    data,
  };
};

/**
 * Create a new expense
 */
export const createExpense = async (data: CreateExpenseData): Promise<ExpensesApiResponse> => {
  const response = await api.post<any>('/expenses', data);
  
  return {
    success: true,
    data: response.data?.data || response.data,
    message: response.data?.message || 'Expense created successfully',
  };
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  id: string,
  data: UpdateExpenseData
): Promise<ExpensesApiResponse> => {
  const response = await api.put<any>(`/expenses/${id}`, data);
  
  return {
    success: true,
    data: response.data?.data || response.data,
    message: response.data?.message || 'Expense updated successfully',
  };
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id: string): Promise<ExpensesApiResponse> => {
  const response = await api.delete<any>(`/expenses/${id}`);
  
  return {
    success: true,
    data: [],
    message: response.data?.message || 'Expense deleted successfully',
  };
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (id: string): Promise<ExpensesApiResponse> => {
  const response = await api.get<any>(`/expenses/${id}`);
  
  return {
    success: true,
    data: [response.data?.data || response.data],
  };
};
