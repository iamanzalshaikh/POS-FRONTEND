import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, FileText, CheckCircle, AlertCircle, PieChart } from 'lucide-react';
import { getSalesReport, getInventoryReport } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import type { SalesReportData, InventoryReportData } from '../../api/finance.api';
import type { Expense } from '../../utils/expense-utils';
import { EXPENSE_CATEGORIES, formatCurrency, getCategoryLabel } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';

interface MonthlyCloseData {
  period: {
    startDate: string;
    endDate: string;
  };
  sales: {
    totalRevenue: number;
    totalTransactions: number;
    totalDiscount: number;
    totalTax: number;
    netRevenue: number;
  };
  expenses: {
    total: number;
    byCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  inventory: {
    openingStock?: number;
    closingStock: number;
    stockValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  profit: {
    grossProfit: number;
    grossMargin: number;
    netProfit: number;
    netMargin: number;
  };
}

const MonthlyCloseReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonthlyCloseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate month start and end dates
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      console.log('≡ƒôè [MonthlyClose] Fetching data for:', { startDate, endDate, selectedMonth });

      // Fetch sales, inventory, and expenses
      const [salesResponse, inventoryResponse, expensesResponse] = await Promise.all([
        getSalesReport({ startDate, endDate }),
        getInventoryReport(),
        getExpenses()
      ]);

      console.log('≡ƒôè [MonthlyClose] Sales Response:', salesResponse);
      console.log('≡ƒôè [MonthlyClose] Inventory Response:', inventoryResponse);
      console.log('≡ƒôè [MonthlyClose] Expenses Response:', expensesResponse);

      if (!salesResponse.success || !inventoryResponse.success) {
        throw new Error('Failed to fetch data');
      }

      const salesData = salesResponse.data as SalesReportData;
      const inventoryData = inventoryResponse.data as InventoryReportData;
      
      // Filter expenses by selected month
      let allExpenses: Expense[] = [];
      if (expensesResponse.success && expensesResponse.data) {
        allExpenses = expensesResponse.data.filter((expense: Expense) => {
          const expenseDate = new Date(expense.date);
          const expenseMonth = expenseDate.toISOString().slice(0, 7);
          return expenseMonth === selectedMonth;
        });
      }
      
      console.log('≡ƒôè [MonthlyClose] Filtered expenses:', allExpenses.length, 'items');

      // Calculate sales metrics
      const totalRevenue = salesData.summary.totalRevenue;
      const totalDiscount = salesData.summary.totalDiscount;
      const totalTax = salesData.summary.totalTax;
      const netRevenue = totalRevenue - totalDiscount - totalTax;

      // Calculate actual expenses from API
      const totalExpenses = allExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      console.log('≡ƒôè [MonthlyClose] Total Expenses:', totalExpenses);

      // Calculate expense breakdown by category
      const expenseByCategory = EXPENSE_CATEGORIES
        .map(cat => {
          const catExpenses = allExpenses.filter(e => e.category === cat.value);
          const catAmount = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
          return {
            category: cat.label,
            value: cat.value,
            amount: catAmount,
            percentage: totalExpenses > 0 ? (catAmount / totalExpenses) * 100 : 0,
          };
        })
        .filter(c => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      console.log('≡ƒôè [MonthlyClose] Expense by Category:', expenseByCategory);

      // Calculate profit with ACTUAL expenses (no estimates)
      const grossProfit = netRevenue - totalExpenses;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfit = grossProfit; // For now, net = gross (can add other deductions later)
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setData({
        period: {
          startDate,
          endDate
        },
        sales: {
          totalRevenue,
          totalTransactions: salesData.summary.totalTransactions,
          totalDiscount,
          totalTax,
          netRevenue
        },
        expenses: {
          total: totalExpenses,
          byCategory: expenseByCategory
        },
        inventory: {
          closingStock: inventoryData.summary.totalStockValue,
          stockValuation: inventoryData.summary.totalStockValue,
          lowStockCount: inventoryData.summary.lowStockCount,
          outOfStockCount: inventoryData.summary.outOfStockCount
        },
        profit: {
          grossProfit,
          grossMargin,
          netProfit,
          netMargin
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch monthly close data:', err);
      setError(err.message || 'Failed to load monthly close report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm font-bold text-slate-500">Loading monthly close report...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-slate-400">No data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText size={28} className="text-blue-400" />
              Monthly Close Report
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Financial summary and closing statement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-black text-blue-900 mb-2">
            {getMonthName(selectedMonth)}
          </h3>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">
            {data.period.startDate} to {data.period.endDate}
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.sales.totalRevenue)}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(data.sales.netRevenue)}
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(data.profit.grossProfit)}
          icon={TrendingUp}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <MetricCard
          title="Stock Value"
          value={formatCurrency(data.inventory.closingStock)}
          icon={FileText}
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <DollarSign size={20} className="text-emerald-400" />
            Sales Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Gross Revenue</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.sales.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Discounts Given</span>
              <span className="text-sm font-black text-red-600">-{formatCurrency(data.sales.totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Tax Collected</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.sales.totalTax)}</span>
            </div>
            <div className="flex justify-between items-center py-3 pt-4">
              <span className="text-sm font-black uppercase text-slate-700 tracking-widest">Net Revenue</span>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(data.sales.netRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <PieChart size={20} className="text-red-400" />
            Expense Breakdown
          </h3>
          {data.expenses.byCategory.length > 0 ? (
            <div className="space-y-3">
              {data.expenses.byCategory.map((cat) => (
                <div key={cat.category} className="flex justify-between items-center py-2">
                  <span className="text-sm font-bold text-slate-700">{cat.category}</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{formatCurrency(cat.amount)}</span>
                    <span className="text-[10px] font-bold text-slate-500 ml-2">({cat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 pt-4 border-t-2 border-slate-200 mt-4">
                <span className="text-sm font-black uppercase text-slate-700 tracking-widest">Total Expenses</span>
                <span className="text-lg font-black text-red-600">{formatCurrency(data.expenses.total)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <PieChart size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No expenses recorded</p>
            </div>
          )}
        </div>

        {/* Inventory Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <FileText size={20} className="text-purple-400" />
            Inventory Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Closing Stock Value</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.inventory.closingStock)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Low Stock Items</span>
              <span className="text-sm font-black text-blue-600">{data.inventory.lowStockCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Out of Stock Items</span>
              <span className="text-sm font-black text-red-600">{data.inventory.outOfStockCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 pt-4">
              <span className="text-sm font-black uppercase text-slate-700 tracking-widest">Stock Health</span>
              {data.inventory.outOfStockCount === 0 && data.inventory.lowStockCount === 0 ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-black">Excellent</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-blue-600">
                  <AlertCircle size={16} />
                  <span className="text-sm font-black">Needs Attention</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
          <TrendingUp size={20} className="text-blue-400" />
          Profit Summary
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-slate-100">
            <span className="text-base font-bold text-slate-700">Net Revenue</span>
            <span className="text-xl font-black text-emerald-600">{formatCurrency(data.sales.netRevenue)}</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-100">
            <span className="text-base font-bold text-slate-700">Total Expenses</span>
            <span className="text-xl font-black text-red-600">-{formatCurrency(data.expenses.total)}</span>
          </div>
          <div className="flex justify-between items-center py-6 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 mt-4">
            <div>
              <span className="text-base font-black uppercase text-blue-900 tracking-widest">Net Profit</span>
              <div className="text-[10px] font-bold text-blue-700 mt-1">
                {data.profit.netMargin.toFixed(1)}% margin
              </div>
            </div>
            <span className="text-3xl font-black text-blue-600">{formatCurrency(data.profit.netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Action Items */}
      {(data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
          <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-3">
            <AlertCircle size={20} />
            Action Required
          </h3>
          <div className="space-y-3">
            {data.inventory.outOfStockCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">
                    {data.inventory.outOfStockCount} product(s) out of stock
                  </p>
                  <p className="text-xs font-bold text-red-700 mt-1">
                    Immediate replenishment required
                  </p>
                </div>
              </div>
            )}
            {data.inventory.lowStockCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {data.inventory.lowStockCount} product(s) below reorder level
                  </p>
                  <p className="text-xs font-bold text-amber-700 mt-1">
                    Consider placing purchase orders
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCloseReport;
