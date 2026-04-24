import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, DollarSign, Calendar, FolderPlus, Search, Edit2, Trash2, Loader2, Wallet, AlertCircle, Tags } from 'lucide-react';
import {
  getExpenses,
  getExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  type CreateExpenseData,
} from '../../api/expenses.api';
import type { Expense } from '../../utils/expense-utils';
import {
  getExpenseSummary,
  getCategoryLabel,
  formatDate,
  EXPENSE_CATEGORIES,
} from '../../utils/expense-utils';
import { formatAmount } from '@/utils/format';
import ExpenseModal, { type ExpenseFormData } from '../../components/accountant/ExpenseModal';
import CategoryModal from '../../components/accountant/CategoryModal';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { toast } from '@/lib/toast';
import type { ColumnDef } from '@tanstack/react-table';
import { ManagementPageSkeleton } from '@/components/ui/skeletons/ManagementPageSkeleton';
import { cn } from '@/lib/utils';
import { getSuppliers, getSupplierPurchases } from '../../api/suppliers.api';

interface GroupedSupplierExpense {
  isGrouped: true;
  supplierId: string;
  category: 'SUPPLIER_PURCHASE';
  description: string;
  amount: number; // This will show Total
  paidAmount: number; // This will show Paid
  date: string;
  id: string; // Synthetic ID
}

type TableRow = Expense | GroupedSupplierExpense;

const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Queries
  const { data: expensesRes, isLoading: loading, refetch } = useQuery({
    queryKey: ['accountant-expenses-list'],
    queryFn: () => getExpenses(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['accountant-expense-categories'],
    queryFn: () => getExpenseCategories(),
  });

  const expenses = useMemo(() => {
    if (expensesRes?.success) return expensesRes.data || [];
    return [];
  }, [expensesRes]);

  const customCategories = useMemo(() => {
    if (categoriesRes?.success) {
      return (categoriesRes.data || []).filter(
        (c) => !c.isDefault && c.name.toLowerCase() !== 'other'
      );
    }
    return [];
  }, [categoriesRes]);

  const summary = useMemo(() => getExpenseSummary(expenses), [expenses]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) => createExpense(data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Expense created successfully');
        queryClient.invalidateQueries({ queryKey: ['accountant-expenses-list'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-sales-report'] });
        setIsModalOpen(false);
      } else {
        toast.error(res.message || 'Failed to create expense');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateExpenseData }) => updateExpense(id, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Expense updated successfully');
        queryClient.invalidateQueries({ queryKey: ['accountant-expenses-list'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-sales-report'] });
        setIsModalOpen(false);
      } else {
        toast.error(res.message || 'Failed to update expense');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Expense deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['accountant-expenses-list'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-summary'] });
        queryClient.invalidateQueries({ queryKey: ['accountant-finance-sales-report'] });
      } else {
        toast.error(res.message || 'Failed to delete expense');
      }
    }
  });

  const handleSubmit = async (data: ExpenseFormData) => {
    const expenseData: CreateExpenseData = {
      category: data.category,
      description: data.description,
      amount: Number(data.amount),
      date: data.date,
      notes: data.notes || undefined,
      customCategoryId: data.customCategoryId,
      subcategoryId: data.subcategoryId,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: expenseData });
    } else {
      createMutation.mutate(expenseData);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-list-brief'],
    queryFn: () => getSuppliers(),
  });

  const { data: purchasesRes } = useQuery({
    queryKey: ['all-supplier-purchases-brief'],
    queryFn: () => getSupplierPurchases({ limit: 1000 }), // High limit for grouping
  });

  const suppliers = useMemo(() => suppliersRes?.data?.data || [], [suppliersRes]);
  const purchases = useMemo(() => purchasesRes?.data?.data?.items || [], [purchasesRes]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const isSalary = e.category === 'SALARIES';
      if (isSalary) return false;

      const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            e.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = categoryFilter === 'ALL';
      if (!matchesCategory) {
        if (categoryFilter.startsWith('CUSTOM:')) {
          matchesCategory = e.customCategoryId === categoryFilter.replace('CUSTOM:', '');
        } else {
          matchesCategory = e.category === categoryFilter;
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

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
      cell: ({ row }) => {
        const expense = row.original;
        const parentLabel = expense.customCategory 
          ? expense.customCategory.name 
          : getCategoryLabel(expense.category);
        
        return (
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
              {parentLabel}
            </span>
            {expense.subcategory && (
              <span className="flex items-center gap-1 text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                <Tags size={10} className="opacity-70" />
                {expense.subcategory.name}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: "Amount",
      cell: ({ row }) => {
        const expense = row.original;
        const isSupplierPurchase = expense.category === 'SUPPLIER_PURCHASE';

        return (
          <div className="flex flex-col items-center justify-center">
            <div className="text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest tabular-nums">
              {formatAmount(expense.amount)}
            </div>
            {isSupplierPurchase && (
              <div className="flex flex-col mt-1 space-y-0.5">
                <div className="text-[9px] font-medium text-slate-500 uppercase tracking-tight leading-tight">
                  Total: {formatAmount(expense.amount)}
                </div>
                <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight leading-tight flex justify-center gap-1">
                  <span>Paid:</span> {formatAmount(expense.paidAmount || 0)}
                </div>
                {(expense.amount - (expense.paidAmount || 0)) > 0 && (
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight leading-tight">
                    Remaining: {formatAmount(expense.amount - (expense.paidAmount || 0))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
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
      cell: ({ row }) => {
        const expense = row.original;
        const isSupplier = expense.category === 'SUPPLIER_PURCHASE';

        return (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => {
                setEditingExpense(expense);
                setIsModalOpen(true);
              }}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-slate-700 dark:hover:text-white transition-all active:scale-95 border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed group/edit relative"
              title={isSupplier ? "Cannot edit supplier payments" : "Edit"}
              disabled={updateMutation.isPending || isSupplier}
            >
              <Edit2 size={16} />
              {isSupplier && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/edit:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  Cleared Record (Locked)
                </div>
              )}
            </button>
            <button
              onClick={() => handleDelete(expense.id)}
              className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 border border-rose-100 dark:border-rose-900/50 disabled:opacity-50 disabled:cursor-not-allowed group/del relative"
              title={isSupplier ? "Cannot delete supplier payments" : "Delete"}
              disabled={deleteMutation.isPending || isSupplier}
            >
              {deleteMutation.isPending && deleteMutation.variables === expense.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isSupplier && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/del:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20">
                  Cleared Record (Locked)
                </div>
              )}
            </button>
          </div>
        );
      }
    }
  ];

  if (loading) return <ManagementPageSkeleton cards={3} columns={5} />;

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

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Today's Expenses"
          value={formatAmount(summary.today)}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="This Month"
          value={formatAmount(summary.thisMonth)}
          icon={Calendar}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Total Expenses"
          value={formatAmount(summary.total)}
          icon={TrendingUp}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <MetricCard
          title="Supplier Paid"
          value={formatAmount(summary.paid)}
          icon={Wallet}
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
          subtitle="Cash Paid Out"
        />
        <MetricCard
          title="Pending Payables"
          value={formatAmount(summary.remaining)}
          icon={AlertCircle}
          colorClass={cn(
            "border",
            summary.remaining > 0 
              ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30" 
              : "bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800/30"
          )}
          subtitle={summary.remaining > 0 ? "Outstanding Debt" : "All Settled"}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={filteredExpenses}
          isLoading={loading}
          onRefresh={refetch}
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
                {EXPENSE_CATEGORIES.filter(c => c.value !== 'SALARIES').map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
                {customCategories.map((cat) => (
                  <option key={cat.id} value={`CUSTOM:${cat.id}`}>
                    {cat.name}
                  </option>
                ))}
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
        onCategoryCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['accountant-expenses-list'] });
          queryClient.invalidateQueries({ queryKey: ['accountant-expense-categories'] });
        }}
      />
    </div>
  );
};

export default ExpensesPage;
