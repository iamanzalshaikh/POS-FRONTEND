import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter, TrendingUp } from 'lucide-react';
import { getExpenses } from '../../api/expenses.api';
import type { Expense } from '../../utils/expense-utils';
import { EXPENSE_CATEGORIES, formatCurrency, formatDate } from '../../utils/expense-utils';

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

      // Filter by date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= start && expenseDate <= end;
      });

      // Filter by category
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
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['ID', 'Category', 'Description', 'Amount', 'Date', 'Notes'];
    const rows = expenses.map(e => [
      e.id,
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      Number(e.amount).toFixed(2),
      e.date,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const totals = calculateTotals();
    const summary = [
      [],
      ['SUMMARY'],
      [`Total Expenses:`, Number(totals.total).toFixed(2)],
      [`Date Range:`, `${startDate} to ${endDate}`],
      [`Category Filter:`, selectedCategory],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      ...summary.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `expense-report-${startDate}-to-${endDate}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-blue-500" />
              Expense Report
            </h2>
            <p className="text-sm text-slate-500 mt-1">Generate and export expense reports</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!fetched || expenses.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              Start Date
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              End Date
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
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
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {fetched && expenses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{formatCurrency(totals.total)}</div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">{expenses.length} expenses</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Period</span>
              </div>
              <div className="text-sm font-black text-slate-900">{formatDate(startDate)}</div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">to {formatDate(endDate)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <Filter className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Category</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}
              </div>
              <div className="text-[10px] font-bold text-slate-500 mt-1">Filter applied</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Category Breakdown</h3>
            <div className="space-y-4">
              {totals.byCategory.map((cat) => (
                <div key={cat.value} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{cat.category}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{cat.count} expenses</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{formatCurrency(cat.amount)}</div>
                    <div className="text-[10px] font-bold text-slate-500 mt-1">{cat.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Expense Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-slate-500 tracking-widest">Notes</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatDate(expense.date)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-50 text-blue-700">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{expense.notes || '-'}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {fetched && expenses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">No expenses found for the selected criteria</p>
        </div>
      )}
    </div>
  );
};

export default ExpenseReport;
