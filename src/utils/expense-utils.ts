/**
 * Expense Data Utilities
 * 
 * Pure functions for expense data transformation and calculations.
 * Used by both Accountant and Store Admin dashboards.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseSummary {
  today: number;
  thisMonth: number;
  total: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendData {
  month: string;
  amount: number;
  monthKey: string; // YYYY-MM for sorting
}

// ============================================================================
// EXPENSE CATEGORIES
// ============================================================================

export const EXPENSE_CATEGORIES = [
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'RENT', label: 'Rent' },
  { value: 'SALARIES', label: 'Salaries' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'FOOD_BEVERAGES', label: 'Food & Beverages' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
  { value: 'TAXES', label: 'Taxes' },
  { value: 'OTHER', label: 'Other' },
] as const;

// ============================================================================
// SUMMARY CALCULATIONS
// ============================================================================

/**
 * Calculate total expenses from all records
 */
export const getTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Calculate today's expenses
 */
export const getTodayExpenses = (expenses: Expense[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Calculate current month's expenses
 */
export const getMonthlyExpenses = (expenses: Expense[]): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
};

/**
 * Get complete expense summary (today, month, total)
 */
export const getExpenseSummary = (expenses: Expense[]): ExpenseSummary => {
  return {
    today: getTodayExpenses(expenses),
    thisMonth: getMonthlyExpenses(expenses),
    total: getTotalExpenses(expenses),
  };
};

// ============================================================================
// CATEGORY ANALYSIS
// ============================================================================

/**
 * Get category-wise expense breakdown
 */
export const getCategorySummary = (expenses: Expense[]): CategorySummary[] => {
  const categoryMap = new Map<string, { amount: number; count: number }>();
  
  expenses.forEach(expense => {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1,
    });
  });
  
  const total = getTotalExpenses(expenses);
  
  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: total > 0 ? (data.amount / total) * 100 : 0,
    count: data.count,
  })).sort((a, b) => b.amount - a.amount);
};

// ============================================================================
// MONTHLY TREND
// ============================================================================

/**
 * Get monthly expense trend for the last 12 months
 */
export const getMonthlyTrend = (expenses: Expense[], months: number = 12): MonthlyTrendData[] => {
  const now = new Date();
  const trendMap = new Map<string, number>();
  
  // Initialize last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    trendMap.set(key, 0);
  }
  
  // Aggregate expenses by month
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = trendMap.get(key) || 0;
    trendMap.set(key, current + expense.amount);
  });
  
  // Convert to array with labels
  return Array.from(trendMap.entries()).map(([monthKey, amount]) => ({
    month: new Date(monthKey + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    amount,
    monthKey,
  }));
};

// ============================================================================
// FILTERING & SEARCH
// ============================================================================

/**
 * Filter expenses by category
 */
export const filterByCategory = (expenses: Expense[], category: string): Expense[] => {
  if (!category || category === 'ALL') return expenses;
  return expenses.filter(expense => expense.category === category);
};

/**
 * Filter expenses by month (YYYY-MM format)
 */
export const filterByMonth = (expenses: Expense[], month: string): Expense[] => {
  if (!month) return expenses;
  return expenses.filter(expense => {
    const date = new Date(expense.date);
    const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return expenseMonth === month;
  });
};

/**
 * Search expenses by description or notes
 */
export const searchExpenses = (expenses: Expense[], query: string): Expense[] => {
  if (!query.trim()) return expenses;
  
  const lowerQuery = query.toLowerCase();
  return expenses.filter(expense => 
    expense.description.toLowerCase().includes(lowerQuery) ||
    expense.notes?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Apply all filters to expenses
 */
export const applyFilters = (
  expenses: Expense[],
  options: {
    category?: string;
    month?: string;
    search?: string;
  }
): Expense[] => {
  let result = [...expenses];
  
  if (options.category && options.category !== 'ALL') {
    result = filterByCategory(result, options.category);
  }
  
  if (options.month) {
    result = filterByMonth(result, options.month);
  }
  
  if (options.search) {
    result = searchExpenses(result, options.search);
  }
  
  return result;
};

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format amount as currency (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Get month options for filter dropdown (last 12 months)
 */
export const getMonthOptions = (): { value: string; label: string }[] => {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
};

/**
 * Get category label from value
 */
export const getCategoryLabel = (value: string): string => {
  const category = EXPENSE_CATEGORIES.find(c => c.value === value);
  return category?.label || value;
};
