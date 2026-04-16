import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, FolderPlus, Search, Edit2, Trash2 } from 'lucide-react';
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
  formatCurrency,
  formatAmount,
  getCategoryLabel,
  formatDate,
} from '../../utils/expense-utils';
import ExpenseModal, { type ExpenseFormData } from '../../components/accountant/ExpenseModal';
import CategoryModal from '../../components/accountant/CategoryModal';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import type { ColumnDef } from '@tanstack/react-table';

const ExpensesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [summary, setSummary] = useState({ today: 0, thisMonth: 0, total: 0 });

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    setSummary(getExpenseSummary(expenses));
  }, [expenses]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      if (response.success) {
        setExpenses(response.data);
      }
    } catch (error: any) {
      showToast('Failed to fetch expenses', 'error');
    } finally {
      setLoading(false);
    }
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
      }
    } else {
      const response = await createExpense(expenseData);
      if (response.success) {
        showToast('Expense created successfully', 'success');
        await fetchExpenses();
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteExpense(id);
      if (response.success) {
        showToast('Expense deleted successfully', 'success');
        await fetchExpenses();
      }
    } catch (error: any) {
      showToast('Failed to delete expense', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    toast[type](message);
  };

  const filteredExpenses = expenses.filter(e => {
    const isSalary = e.category === 'SALARIES';
    if (isSalary) return false;

    const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const columns: ColumnDef<Expense>[] = [
    {
      header: "Expense ID",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.displayId || `#${row.original.id.slice(-6).toUpperCase()}`}
        </div>
      )
    },
    {
      header: "Expense Detail",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.description}</p>
          </div>
        </div>
      )
    },
    
    {
      header: "Category",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
            {getCategoryLabel(row.original.category)}
          </span>
        </div>
      )
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest tabular-nums">
          {formatAmount(row.original.amount)}
        </div>
      )
    },
    {
      header: "Date",
      cell: ({ row }) => (
        <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums leading-none">
          {formatDate(row.original.date)}
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => {
              setEditingExpense(row.original);
              setIsModalOpen(true);
            }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 dark:hover:text-white transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 border border-rose-100 dark:border-rose-900/50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Expenses Management"
        description="Track and manage all business expenses"
        primaryAction={{
          label: "Add Expense",
          icon: TrendingUp,
          onClick: () => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }
        }}
        secondaryAction={{
          label: "Add Category",
          icon: FolderPlus,
          onClick: () => setIsCategoryModalOpen(true)
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Today's Expenses"
          value={formatCurrency(summary.today)}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="This Month"
          value={formatCurrency(summary.thisMonth)}
          icon={Calendar}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(summary.total)}
          icon={TrendingUp}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={filteredExpenses}
          isLoading={loading}
          onRefresh={fetchExpenses}
          placeholder="Search expenses..."
          hidePagination={false}
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
              >
                <option value="ALL">All Categories</option>
                {/* Categories could be dynamically listed here if available */}
              </select>
            </div>
          }
        />
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingExpense={editingExpense}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={fetchExpenses}
      />
    </div>
  );
};

export default ExpensesPage;
