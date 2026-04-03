import React, { useEffect, useState } from 'react';
import { TrendingUp, PieChart as PieChartIcon, DollarSign, Calendar, FileText } from 'lucide-react';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type CreateExpenseData,
} from '../../api/expenses.api';
import type { Expense } from '../../utils/expense-utils';
import {
  getExpenseSummary,
  getCategorySummary,
  getMonthlyTrend,
  applyFilters,
  formatCurrency,
} from '../../utils/expense-utils';
import BarChartLabelCustom from '../../components/global-components/BarChartLabelCustom';
import GlobalPieChart from '../../components/global-components/PieChart';
import ExpensesFilters from '../../components/accountant/ExpensesFilters';
import ExpensesTable from '../../components/accountant/ExpensesTable';
import ExpensePagination from '../../components/accountant/ExpensePagination';
import ExpenseModal, { type ExpenseFormData } from '../../components/accountant/ExpenseModal';
import ExpenseAuditLog from '../../components/accountant/ExpenseAuditLog';
import Toast, { type ToastType } from '../../components/ui/Toast';

// ============================================================================
// TYPES
// ============================================================================

interface FilterState {
  category: string;
  month: string;
  search: string;
}

interface ToastState {
  message: string;
  type: ToastType;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ExpensesPage: React.FC = () => {
  // Data state
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    category: 'ALL',
    month: '',
    search: '',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Audit log state
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);

  // Summary state
  const [summary, setSummary] = useState({ today: 0, thisMonth: 0, total: 0 });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>(
    []
  );
  const [monthlyTrendData, setMonthlyTrendData] = useState<{ month: string; amount: number }[]>([]);

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  // Color palette for categories
  const categoryColors = [
    '#F59E0B',
    '#EF4444',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#6366F1',
    '#14B8A6',
    '#A855F7',
    '#64748B',
  ];

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const filtered = applyFilters(expenses, filters);
    setFilteredExpenses(filtered);
    setPage(1); // Reset to first page when filters change
  }, [expenses, filters]);

  useEffect(() => {
    // Update summaries when expenses change
    console.log('[ExpensesPage] Recalculating summaries with', expenses.length, 'expenses');
    const summaryData = getExpenseSummary(expenses);
    console.log('[ExpensesPage] Summary data:', summaryData);
    setSummary(summaryData);

    const categorySummary = getCategorySummary(expenses);
    console.log('[ExpensesPage] Category summary:', categorySummary);
    setCategoryData(
      categorySummary.map((cat, index) => ({
        name: cat.category,
        value: cat.amount,
        color: categoryColors[index % categoryColors.length],
      }))
    );

    const trend = getMonthlyTrend(expenses);
    console.log('[ExpensesPage] Monthly trend:', trend);
    setMonthlyTrendData(trend.map((t) => ({ month: t.month, amount: t.amount })));
  }, [expenses]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      console.log('[ExpensesPage] Fetching expenses from API...');
      const response = await getExpenses();
      console.log('[ExpensesPage] API Response:', response);
      
      if (response.success) {
        setExpenses(response.data);
        console.log('[ExpensesPage] Set expenses:', response.data.length, 'items');
      } else {
        showToast('Failed to fetch expenses', 'error');
        setExpenses([]);
      }
    } catch (error: any) {
      console.error('[ExpensesPage] Failed to fetch expenses:', error);
      console.error('[ExpensesPage] Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      let errorMessage = 'Failed to fetch expenses';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please ensure you have Accountant role and are assigned to a store.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure backend is running.';
      }
      
      showToast(errorMessage, 'error');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (data: ExpenseFormData) => {
    const expenseData: CreateExpenseData = {
      category: data.category,
      description: data.description,
      amount: Number(data.amount),
      date: data.date,
      notes: data.notes || undefined,
    };

    if (editingExpense) {
      const response = await updateExpense(editingExpense.id, expenseData);
      if (response.success) {
        showToast('Expense updated successfully', 'success');
        await fetchExpenses();
      } else {
        throw new Error(response.message || 'Failed to update expense');
      }
    } else {
      const response = await createExpense(expenseData);
      if (response.success) {
        showToast('Expense created successfully', 'success');
        await fetchExpenses();
      } else {
        throw new Error(response.message || 'Failed to create expense');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteExpense(id);
      if (response.success) {
        showToast('Expense deleted successfully', 'success');
        await fetchExpenses();
        setDeleteConfirmId(null);
      } else {
        showToast(response.message || 'Failed to delete expense', 'error');
      }
    } catch (error: any) {
      console.error('[ExpensesPage] Failed to delete expense:', error);
      showToast('Failed to delete expense', 'error');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'ALL',
      month: '',
      search: '',
    });
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // ============================================================================
  // PAGINATION
  // ============================================================================

  const paginatedExpenses = filteredExpenses.slice((page - 1) * limit, page * limit);
  const totalFiltered = filteredExpenses.length;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-bold text-slate-500">Loading expenses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
          <Toast message={toast.message} type={toast.type} onClose={closeToast} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <PieChartIcon className="w-7 h-7 text-amber-500" />
            Expenses Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all business expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditLogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            title="View audit trail"
          >
            <FileText className="w-5 h-5" />
            Audit Trail
          </button>
          <button
            onClick={handleAddExpense}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <TrendingUp className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
              Today
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.today)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Expenses for today</div>
        </div>

        {/* This Month Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
              This Month
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {formatCurrency(summary.thisMonth)}
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Expenses for current month</div>
        </div>

        {/* Total Expense */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
              Total
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.total)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">All-time expenses</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category-wise Expense Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
              Category Breakdown
            </h3>
          </div>
          {categoryData.length > 0 ? (
            <GlobalPieChart
              data={categoryData}
              dataKey="value"
              nameKey="name"
              compact
              innerRadius={50}
              outerRadius={80}
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-bold">No expense data available</p>
            </div>
          )}
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Monthly Trend
            </h3>
          </div>
          {monthlyTrendData.length > 0 ? (
            <BarChartLabelCustom
              data={monthlyTrendData}
              dataKey="amount"
              labelKey="month"
              config={{
                amount: {
                  label: 'Amount',
                  color: '#10B981',
                },
              }}
              height="min-h-[280px]"
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-bold">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <ExpensesFilters
        searchQuery={filters.search}
        setSearchQuery={(value) => handleFilterChange('search', value)}
        selectedCategory={filters.category}
        setSelectedCategory={(value) => handleFilterChange('category', value)}
        selectedMonth={filters.month}
        setSelectedMonth={(value) => handleFilterChange('month', value)}
        onReset={handleResetFilters}
      />

      {/* Expense Table */}
      <ExpensesTable
        expenses={paginatedExpenses}
        onEdit={handleEditExpense}
        onDelete={handleDelete}
        deleteConfirmId={deleteConfirmId}
        setDeleteConfirmId={setDeleteConfirmId}
      />

      {/* Pagination */}
      {totalFiltered > 0 && (
        <ExpensePagination
          page={page}
          setPage={setPage}
          total={totalFiltered}
          limit={limit}
        />
      )}

      {/* Add/Edit Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingExpense={editingExpense}
      />

      {/* Audit Log Modal */}
      <ExpenseAuditLog
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />
    </div>
  );
};

export default ExpensesPage;
