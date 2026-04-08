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
    
    // Handle different response structures
    let data: Expense[];
    if (Array.isArray(response.data)) {
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
    // Fallback to localStorage
    console.warn('[Expenses API] API call failed, using localStorage:', error.message);
    
    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const expenses = getStoredExpenses();
    expenses.unshift(newExpense);
    storeExpenses(expenses);
    
    return {
      success: true,
      data: [newExpense],
      message: 'Expense created (offline mode)',
    };
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
    const response = await api.put<any>(`/expenses/${id}`, data);
    
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Expense updated successfully',
    };
  } catch (error: any) {
    // Fallback to localStorage
    console.warn('[Expenses API] API call failed, using localStorage:', error.message);
    
    const expenses = getStoredExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      return {
        success: false,
        data: [],
        message: 'Expense not found',
      };
    }
    
    expenses[index] = {
      ...expenses[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    storeExpenses(expenses);
    
    return {
      success: true,
      data: [expenses[index]],
      message: 'Expense updated (offline mode)',
    };
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
    // Fallback to localStorage
    console.warn('[Expenses API] API call failed, using localStorage:', error.message);
    
    const expenses = getStoredExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    
    if (filtered.length === expenses.length) {
      return {
        success: false,
        data: [],
        message: 'Expense not found',
      };
    }
    
    storeExpenses(filtered);
    
    return {
      success: true,
      data: [],
      message: 'Expense deleted (offline mode)',
    };
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
