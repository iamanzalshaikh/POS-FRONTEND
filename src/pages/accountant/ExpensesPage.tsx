import React, { useEffect, useState, useMemo } from 'react';
import { Calculator, Plus, Search, Filter, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../../api/expenses.api';
import type { Expense } from '../../utils/expense-utils';
import {
  getExpenseSummary,
  getMonthlyTrend,
  applyFilters,
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORIES,
  getCategoryLabel,
  getMonthOptions,
} from '../../utils/expense-utils';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';

// ============================================================================
// TYPES
// ============================================================================

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  date: string;
  notes: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const ExpensesPage: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Summary state
  const [summary, setSummary] = useState({ today: 0, thisMonth: 0, total: 0 });



  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    const filtered = applyFilters(expenses, {
      category: selectedCategory,
      month: selectedMonth,
      search: searchQuery,
    });
    setFilteredExpenses(filtered);
  }, [expenses, selectedCategory, selectedMonth, searchQuery]);

  useEffect(() => {
    // Update summaries when expenses change
    const summaryData = getExpenseSummary(expenses);
    setSummary(summaryData);

    getMonthlyTrend(expenses);
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
      }
    } catch (error) {
      console.error('[ExpensesPage] Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString(),
        date: expense.date,
        notes: expense.notes || '',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const expenseData = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      notes: formData.notes,
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
      } else {
        await createExpense(expenseData);
      }
      await fetchExpenses();
      handleCloseModal();
    } catch (error) {
      console.error('[ExpensesPage] Failed to save expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await fetchExpenses();
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('[ExpensesPage] Failed to delete expense:', error);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedMonth('');
  };

  // ============================================================================
  // COLUMNS
  // ============================================================================

  const columns: ColumnDef<Expense>[] = useMemo(() => [
    {
      accessorKey: "index",
      header: "Ref ID",
      cell: ({ row }) => <span className="font-mono text-[11px] text-slate-300 font-medium tracking-tighter">{(row.index + 1).toString().padStart(4, '0')}</span>,
    },
    {
      accessorKey: "description",
      header: "Expense Details",
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{expense.description}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{getCategoryLabel(expense.category)}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "amount",
      header: "Value",
      cell: ({ row }) => (
        <span className="text-sm font-black text-slate-900 dark:text-white">
          {formatCurrency(row.getValue<number>("amount"))}
        </span>
      )
    },
    {
      accessorKey: "date",
      header: "Posting Date",
      cell: ({ row }) => <span className="text-sm text-slate-500 font-medium">{formatDate(row.getValue<string>("date"))}</span>
    },
    {
      id: "category_badge",
      header: "Category",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-lg px-4 py-1.5 min-w-[80px]">
            {getCategoryLabel(row.original.category).slice(0, 8)}
          </div>
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const expense = row.original;
        return (
          <div className="flex items-center justify-end gap-3 px-2">
            <button
              onClick={() => handleOpenModal(expense)}
              className="text-slate-300 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            {deleteConfirmId === expense.id ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="px-2 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg"
                >
                  OK
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-lg"
                >
                  NO
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(expense.id)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            )}
          </div>
        );
      }
    }
  ], [deleteConfirmId]);

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

  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Calculator className="w-7 h-7 text-amber-500" />
            Expenses Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage all business expenses</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Today</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.today)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Expenses for today</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">This Month</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.thisMonth)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">Expenses for current month</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.total)}</div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">All-time expenses</div>
        </div>
      </div>

      {/* Charts Row Removed (Missing Components) */}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-48">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer"
            >
              <option value="">All Months</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedCategory !== 'ALL' || selectedMonth) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <DataTable
        columns={columns}
        data={filteredExpenses}
        searchKey="description"
        placeholder="Search expenses..."
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="e.g., Office supplies purchase"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional details..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
