import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, FolderPlus } from 'lucide-react';
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
  applyFilters,
  formatCurrency,
} from '../../utils/expense-utils';
import ExpensesFilters from '../../components/accountant/ExpensesFilters';
import ExpensesTable from '../../components/accountant/ExpensesTable';
import ExpensePagination from '../../components/accountant/ExpensePagination';
import ExpenseModal, { type ExpenseFormData } from '../../components/accountant/ExpenseModal';
import CategoryModal from '../../components/accountant/CategoryModal';
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState({ today: 0, thisMonth: 0, total: 0 });

  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

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
    const summaryData = getExpenseSummary(expenses);
    setSummary(summaryData);
  }, [expenses]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();

      if (response.success) {
        setExpenses(response.data);
      } else {
        showToast('Failed to fetch expenses', 'error');
        setExpenses([]);
      }
    } catch (error: any) {
      console.error('[ExpensesPage] Failed to fetch expenses:', error);

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
      customCategoryId: data.customCategoryId,
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
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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
          <h1 className="text-3xl font-black tracking-tight">Expenses Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all business expenses</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-500"
          >
            <FolderPlus className="w-5 h-5" />
            Add Category
          </button>
          <button
            onClick={handleAddExpense}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 border border-blue-500"
          >
            <TrendingUp className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today'sExpense */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all">
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
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-500" />
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
        <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all">
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

      {/* Category Management Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={fetchExpenses}
      />
    </div>
  );
};

export default ExpensesPage;
