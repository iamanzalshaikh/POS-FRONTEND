import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Calendar, Filter, TrendingUp } from 'lucide-react';
import { getExpenses, getExpenseCategories } from '../../api/expenses.api';
import { EXPENSE_CATEGORIES, formatCurrency, formatDate, getCategoryLabel } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';


import { exportToExcel } from '../../utils/excel-export';


const ExpenseReport: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [fetched, setFetched] = useState(false);

  // Query
  const { data: expRes, isLoading: loading, refetch } = useQuery({
    queryKey: ['accountant-expenses-report'],
    queryFn: () => getExpenses(),
    staleTime: 1000 * 60 * 5,
    enabled: fetched,
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['accountant-expense-categories-report'],
    queryFn: () => getExpenseCategories(),
  });

  const fetchReport = () => {
    setFetched(true);
    refetch();
  };

  const rawExpenses = expRes?.data || [];

  const customCategories = useMemo(() => {
    if (categoriesRes?.success) {
      return (categoriesRes.data || []).filter(
        (c) => !c.isDefault && c.name.toLowerCase() !== 'other'
      );
    }
    return [];
  }, [categoriesRes]);

  const expenses = useMemo(() => {
    if (!fetched) return [];
    let filtered = rawExpenses;
    
    // Normalize user selected dates to midnight
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day
    
    filtered = filtered.filter((expense: any) => {
      const expenseDate = new Date(expense.date);
      // We don't normalize expenseDate to midnight because we have end at 23:59:59
      // This allows entries with timestamps on the same day to be included.
      return expenseDate >= start && expenseDate <= end;
    });

    if (selectedCategory !== 'ALL') {
      if (selectedCategory.startsWith('CUSTOM:')) {
        const customId = selectedCategory.replace('CUSTOM:', '');
        filtered = filtered.filter((expense: any) => expense.customCategoryId === customId);
      } else {
        // Case-insensitive match just in case
        filtered = filtered.filter((expense: any) => 
          expense.category.toUpperCase() === selectedCategory.toUpperCase()
        );
      }
    }
    return filtered;
  }, [rawExpenses, startDate, endDate, selectedCategory, fetched]);

  const calculateTotals = () => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Default categories
    const byDefaultCategory = EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.value && !e.customCategoryId);
      return {
        category: cat.label,
        value: cat.value,
        amount: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
        percentage: total > 0 ? (catExpenses.reduce((sum, e) => sum + e.amount, 0) / total) * 100 : 0,
      };
    });

    // Custom categories
    const byCustomCategory = customCategories.map(cat => {
      const catExpenses = expenses.filter(e => e.customCategoryId === cat.id);
      return {
        category: cat.name,
        value: `CUSTOM:${cat.id}`,
        amount: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
        percentage: total > 0 ? (catExpenses.reduce((sum, e) => sum + e.amount, 0) / total) * 100 : 0,
      };
    });

    const combined = [...byDefaultCategory, ...byCustomCategory].filter(c => c.count > 0);

    return { total, byCategory: combined };
  };

  const handleExportXLSX = () => {
    if (expenses.length === 0) return;
    
    const rows = expenses.map(e => {
      const customCat = customCategories.find(c => c.id === e.customCategoryId);
      const catLabel = customCat ? customCat.name : getCategoryLabel(e.category);
      return {
        'Ref ID': e.id.slice(-8).toUpperCase(),
        'Date': e.date,
        'Category': catLabel,
        'Description': e.description,
        'Amount': Number(e.amount),
        'Notes': e.notes || '—'
      };
    });

    exportToExcel(rows, `Expense-Report-${startDate}-to-${endDate}`, 'Expenses');
  };

  const totals = calculateTotals();

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Expense Report"
        description="Generate and export detailed expense summaries"
        primaryAction={{
          label: "Export XLS",
          icon: Download,
          onClick: handleExportXLSX
        }}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 flex-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 flex-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="bg-transparent outline-none text-sm font-bold text-slate-900 dark:text-white w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
              {customCategories.map(cat => (
                <option key={cat.id} value={`CUSTOM:${cat.id}`}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full h-[54px] bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {fetched && expenses.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Expenses"
              value={formatCurrency(totals.total)}
              icon={TrendingUp}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            />
            <MetricCard
              title="Transactions"
              value={String(expenses.length)}
              icon={FileSpreadsheet}
              colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            <MetricCard
              title="Category Mix"
              value={String(totals.byCategory.length)}
              icon={Filter}
              colorClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Category Distribution</h3>
              <div className="space-y-4">
                {totals.byCategory.map((cat) => (
                  <div key={cat.value} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{cat.category}</span>
                       <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{cat.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-900 dark:bg-slate-400 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase">{cat.count} items</span>
                       <span className="text-[11px] font-black text-slate-900 dark:text-white">{formatCurrency(cat.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Statement Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Date / Ref</th>
                      <th className="px-8 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Detail</th>
                      <th className="px-8 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expenses.map((expense) => {
                      const customCat = customCategories.find(c => c.id === expense.customCategoryId);
                      return (
                        <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-8 py-5 text-center">
                            <p className="text-xs font-black text-slate-900 dark:text-white">{formatDate(expense.date)}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {expense.id.slice(-6).toUpperCase()}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{expense.description}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase rounded-md border border-slate-200 dark:border-slate-700">
                              {customCat ? customCat.name : getCategoryLabel(expense.category)}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(expense.amount)}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {fetched && expenses.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800">
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-6 text-slate-200" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">No Reports Found</h3>
          
          <div className="max-w-sm mx-auto mb-8 space-y-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No expenses were found for <span className="font-black text-slate-900 dark:text-white">{selectedCategory === 'ALL' ? 'all categories' : getCategoryLabel(selectedCategory.replace('CUSTOM:', ''))}</span> within the selected date range.
            </p>
            
            {(rawExpenses.length > 0) && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-left">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">System Diagnostics</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Total records in database:</span>
                    <span className="font-black text-slate-900 dark:text-white">{rawExpenses.length}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Category matches found:</span>
                    <span className="font-black text-slate-900 dark:text-white">
                      {rawExpenses.filter(e => {
                        if (selectedCategory === 'ALL') return true;
                        if (selectedCategory.startsWith('CUSTOM:')) return e.customCategoryId === selectedCategory.replace('CUSTOM:', '');
                        return e.category.toUpperCase() === selectedCategory.toUpperCase();
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button 
              onClick={() => {
                setStartDate('2023-01-01');
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              className="px-6 py-3 bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-700"
            >
              Show All Time
            </button>
            <button 
              onClick={() => setSelectedCategory('ALL')}
              className="px-6 py-3 bg-slate-900 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg"
            >
              Reset Category
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseReport;
