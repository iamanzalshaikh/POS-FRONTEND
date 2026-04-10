import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter, TrendingUp } from 'lucide-react';
import { getExpenses } from '../../api/expenses.api';
import type { Expense } from '../../utils/expense-utils';
import { EXPENSE_CATEGORIES, formatCurrency, formatDate } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';

const ExpenseReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fetched, setFetched] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await getExpenses();
      let filtered = response.data;

      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      if (selectedCategory !== 'ALL') {
        filtered = filtered.filter(expense => expense.category === selectedCategory);
      }

      setExpenses(filtered);
      setFetched(true);
    } catch (error) {
      console.error('[ExpenseReport] Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = EXPENSE_CATEGORIES.map(cat => {
      const catExpenses = expenses.filter(e => e.category === cat.value);
      return {
        category: cat.label,
        value: cat.value,
        amount: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
        percentage: total > 0 ? (catExpenses.reduce((sum, e) => sum + e.amount, 0) / total) * 100 : 0,
      };
    }).filter(c => c.amount > 0);

    return { total, byCategory };
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Category', 'Description', 'Amount', 'Date', 'Notes'];
    const rows = expenses.map(e => [
      e.id,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      Number(e.amount).toFixed(2),
      e.date,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `expense-report-${startDate}-to-${endDate}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const totals = calculateTotals();

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Expense Report"
        description="Generate and export detailed expense summaries"
        primaryAction={{
          label: "Export CSV",
          icon: Download,
          onClick: handleExportCSV
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
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-8 py-5 text-center">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{formatDate(expense.date)}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {expense.id.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{expense.description}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase rounded-md border border-slate-200 dark:border-slate-700">{expense.category}</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(expense.amount)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {fetched && expenses.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-20 text-center border border-slate-100 dark:border-slate-800">
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-6 text-slate-200" />
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No data found</h3>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 text-center mx-auto">Try adjusting your filters to see more results</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseReport;
