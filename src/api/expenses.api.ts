import api from '../service/api';
import axios, { type AxiosError } from 'axios';
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

// ============================================================================
// LOCAL STORAGE FALLBACK
// For demo/offline functionality
// ============================================================================

const EXPENSES_STORAGE_KEY = 'pos_expenses_data';

const getStoredExpenses = (): Expense[] => {
  try {
    const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with sample data if empty
    const sampleExpenses: Expense[] = [
      {
        id: 'exp_1',
        category: 'UTILITIES',
        description: 'Electricity Bill - March',
        amount: 12500,
        date: new Date().toISOString().split('T')[0],
        notes: 'Monthly electricity payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_2',
        category: 'SUPPLIES',
        description: 'Office Supplies Purchase',
        amount: 3200,
        date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        notes: 'Stationery and cleaning supplies',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_3',
        category: 'MAINTENANCE',
        description: 'POS System Repair',
        amount: 5000,
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
        notes: 'Hardware maintenance',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_4',
        category: 'MARKETING',
        description: 'Social Media Campaign',
        amount: 8000,
        date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0],
        notes: 'Instagram ads for festival sale',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_5',
        category: 'TRANSPORT',
        description: 'Delivery Vehicle Fuel',
        amount: 4500,
        date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0],
        notes: 'Monthly fuel expense',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(sampleExpenses));
    return sampleExpenses;
  } catch (error) {
    console.error('[Expenses API] Failed to get stored expenses:', error);
    return [];
  }
};

const storeExpenses = (expenses: Expense[]): void => {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('[Expenses API] Failed to store expenses:', error);
  }
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch all expenses
 * Tries API first, falls back to localStorage if unavailable
 */
export const getExpenses = async (): Promise<ExpensesApiResponse> => {
  try {
    const response = await api.get<any>('/expenses');

    console.log('[Expenses API] Raw API response:', response.data);

    // Handle different response structures
    let data: Expense[];
    if (Array.isArray(response.data)) {
      data = response.data;
    } else if (response.data?.data?.items && Array.isArray(response.data.data.items)) {
      // Paginated response: { success, data: { items: [...], pagination: {...} } }
      data = response.data.data.items;
      console.log('[Expenses API] Parsed paginated response, items:', data.length);
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      // Flat array: { success, data: [...] }
      data = response.data.data;
      console.log('[Expenses API] Parsed flat array response, items:', data.length);
    } else {
      console.warn('[Expenses API] Unknown response structure:', response.data);
      data = [];
    }

    // Prisma Decimal serializes to string — normalize to number
    const normalized = data.map((item: Expense) => ({
      ...item,
      amount: Number(item.amount),
    }));

    return {
      success: true,
      data: normalized,
    };
  } catch (error: any) {
    // If API fails (e.g., endpoint doesn't exist yet), use localStorage
    console.warn('[Expenses API] API call failed, using localStorage:', error.message);
    const storedExpenses = getStoredExpenses();
    return {
      success: true,
      data: storedExpenses,
      message: 'Using offline data',
    };
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (data: CreateExpenseData): Promise<ExpensesApiResponse> => {
  try {
    const response = await api.post<any>('/expenses', data);

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Expense created successfully',
    };
  } catch (error: any) {
    // Log detailed error for debugging
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error('[Expenses API] Create expense failed:', { status, message, data });

    // Re-throw the error instead of silently falling back
    throw error;
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (
  id: string,
  data: UpdateExpenseData
): Promise<ExpensesApiResponse> => {
  try {
    const response = await api.patch<any>(`/expenses/${id}`, data);

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Expense updated successfully',
    };
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error('[Expenses API] Update expense failed:', { status, message, id, data });
    throw error;
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id: string): Promise<ExpensesApiResponse> => {
  try {
    const response = await api.delete<any>(`/expenses/${id}`);

    return {
      success: true,
      data: [],
      message: response.data?.message || 'Expense deleted successfully',
    };
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    console.error('[Expenses API] Delete expense failed:', { status, message, id });
    throw error;
  }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (id: string): Promise<ExpensesApiResponse> => {
  try {
    const response = await api.get<any>(`/expenses/${id}`);

    return {
      success: true,
      data: [response.data?.data || response.data],
    };
  } catch (error: any) {
    // Fallback to localStorage
    const expenses = getStoredExpenses();
    const expense = expenses.find(e => e.id === id);

    if (!expense) {
      return {
        success: false,
        data: [],
        message: 'Expense not found',
      };
    }

    return {
      success: true,
      data: [expense],
    };
  }
};

// ============================================================================
// CUSTOM CATEGORIES API
// ============================================================================

export interface ExpenseCategory {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesApiResponse {
  success: boolean;
  data: ExpenseCategory[];
  message?: string;
}

/**
 * Fetch all custom expense categories
 */
export const getExpenseCategories = async (): Promise<CategoriesApiResponse> => {
  try {
    const response = await api.get<any>('/expenses/categories');

    let data: ExpenseCategory[];
    // Backend returns: { success: true, data: { defaultCategories: [...], customCategories: [...] } }
    if (response.data?.data?.customCategories && Array.isArray(response.data.data.customCategories)) {
      const custom = response.data.data.customCategories;
      const defaults = response.data.data.defaultCategories || [];
      data = [...defaults, ...custom];
    } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
      data = response.data.data.data;
    } else if (Array.isArray(response.data?.data)) {
      data = response.data.data;
    } else if (Array.isArray(response.data)) {
      data = response.data;
    } else {
      data = [];
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.warn('[Expenses API] Failed to fetch categories:', error.message);
    return {
      success: true,
      data: [],
    };
  }
};

/**
 * Create a new custom expense category
 */
export const createExpenseCategory = async (name: string): Promise<CategoriesApiResponse> => {
  try {
    const response = await api.post<any>('/expenses/categories', { name });

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Category created successfully',
    };
  } catch (error: any) {
    console.error('[Expenses API] Failed to create category:', error);
    throw error;
  }
};

/**
 * Update a custom expense category
 */
export const updateExpenseCategory = async (
  id: string,
  name: string
): Promise<CategoriesApiResponse> => {
  try {
    const response = await api.patch<any>(`/expenses/categories/${id}`, { name });

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Category updated successfully',
    };
  } catch (error: any) {
    console.error('[Expenses API] Failed to update category:', error);
    throw error;
  }
};

/**
 * Delete a custom expense category
 */
export const deleteExpenseCategory = async (id: string): Promise<CategoriesApiResponse> => {
  try {
    const response = await api.delete<any>(`/expenses/categories/${id}`);

    return {
      success: true,
      data: [],
      message: response.data?.message || 'Category deleted successfully',
    };
  } catch (error: any) {
    console.error('[Expenses API] Failed to delete category:', error);
    throw error;
  }
};
