import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, FileText, CheckCircle, AlertCircle, PieChart, Download, Search, Loader2, ArrowDownRight } from 'lucide-react';
import { getSalesReport, getInventoryReport } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import type { SalesReportData, InventoryReportData } from '../../api/finance.api';
import type { Expense } from '../../utils/expense-utils';
import { EXPENSE_CATEGORIES, formatCurrency, getCategoryLabel } from '../../utils/expense-utils';
import { toLocalYMD } from '../../utils/format';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { MonthPicker } from '../../components/global-components/Calendar/MonthPicker';
import type { ColumnDef } from '@tanstack/react-table';

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
  const [selectedMonth, setSelectedMonth] = useState(toLocalYMD(new Date()).slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate month start and end dates
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = toLocalYMD(new Date(year, month - 1, 1));
      const endDate = toLocalYMD(new Date(year, month, 0));

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

  const formatCurrencyLocal = (value: number) => {
    return formatCurrency(value);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) return <MonthlyCloseSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const totalRevenue = data.sales.totalRevenue;
  const grossProfit = data.profit.grossProfit;
  const netProfit = data.profit.netProfit;

  interface MonthlyReportRow {
    id: string;
    item: string;
    category: string;
    amount: number;
    percentage: number;
    status: 'revenue' | 'cost' | 'expense';
  }

  const tableRows: MonthlyReportRow[] = [
    {
      id: 'revenue',
      item: 'Gross Revenue',
      category: 'Revenue',
      amount: data.sales.totalRevenue,
      percentage: 100,
      status: 'revenue'
    },
    {
      id: 'discount',
      item: 'Discounts Applied',
      category: 'Adjustments',
      amount: data.sales.totalDiscount,
      percentage: (data.sales.totalDiscount / data.sales.totalRevenue) * 100,
      status: 'cost'
    },
    {
      id: 'tax',
      item: 'Tax Collected',
      category: 'Adjustments',
      amount: data.sales.totalTax,
      percentage: (data.sales.totalTax / data.sales.totalRevenue) * 100,
      status: 'revenue'
    },
    {
      id: 'net-revenue',
      item: 'Net Revenue',
      category: 'Subtotal',
      amount: data.sales.netRevenue,
      percentage: (data.sales.netRevenue / data.sales.totalRevenue) * 100,
      status: 'revenue'
    },
    {
      id: 'expenses',
      item: 'Total Expenses',
      category: 'Operating',
      amount: data.expenses.total,
      percentage: (data.expenses.total / data.sales.totalRevenue) * 100,
      status: 'expense'
    },
    {
      id: 'net-profit',
      item: 'Net Profit',
      category: 'Bottom Line',
      amount: data.profit.netProfit,
      percentage: data.profit.netMargin,
      status: data.profit.netProfit >= 0 ? 'revenue' : 'cost'
    }
  ];

  const columns: ColumnDef<MonthlyReportRow>[] = [
    {
      header: "Line Item",
      cell: ({ row }) => (
        <div className="text-left">
          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.item}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{row.original.category}</p>
        </div>
      )
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(row.original.amount)}
        </div>
      )
    },
    {
      header: "% of Revenue",
      cell: ({ row }) => (
        <div className="text-center text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
          {row.original.percentage.toFixed(1)}%
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const statusConfig: Record<'revenue' | 'cost' | 'expense', { text: string; bg: string; color: string; icon: string }> = {
          'revenue': { text: 'Revenue', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-700 dark:text-emerald-400', icon: '+' },
          'cost': { text: 'Cost', bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-700 dark:text-red-400', icon: '−' },
          'expense': { text: 'Expense', bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-700 dark:text-amber-400', icon: '−' }
        };
        const config = statusConfig[row.original.status];
        
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color}`}>
              <span>{config.icon}</span>
              {config.text}
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Monthly Close Report"
        description="Financial summary and closing statement"
        primaryAction={{
          label: "Export Report",
          icon: Download,
          onClick: () => {
            // Export functionality
          }
        }}
      >
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-[260px]">
          <MonthPicker
            value={selectedMonth}
            onChange={(val) => val && setSelectedMonth(val)}
            className="border-none bg-transparent h-auto py-0 hover:bg-transparent shadow-none"
          />
        </div>
      </PageHeader>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Gross Revenue"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalRevenue).replace('PKR', 'Rs').trim()}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Gross Profit"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(grossProfit).replace('PKR', 'Rs').trim()}
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Net Profit"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(netProfit).replace('PKR', 'Rs').trim()}
          icon={PieChart}
          colorClass={netProfit >= 0 ? "bg-slate-900 text-white dark:bg-slate-800" : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={tableRows}
          isLoading={loading}
          onRefresh={fetchMonthlyData}
          placeholder="Search line items..."
          hidePagination={false}
          manualPagination={false}
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search line items..."
                  className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                />
              </div>
            </div>
          }
        />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Margin Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Gross Margin</span>
              <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{data.profit.grossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Expense Ratio</span>
              <span className="text-[12px] font-black text-red-600 dark:text-red-400 tabular-nums">{data.expenses.total > 0 ? ((data.expenses.total / data.sales.totalRevenue) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Net Margin</span>
              <span className={`text-[12px] font-black tabular-nums ${data.profit.netMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{data.profit.netMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Financial Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total Transactions</span>
              <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">{data.sales.totalTransactions} sales</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Stock Value</span>
              <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">Rs {new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.inventory.closingStock)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Stock Status</span>
              {data.inventory.outOfStockCount === 0 && data.inventory.lowStockCount === 0 ? (
                <span className="flex items-center gap-2 text-[12px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={14} />
                  Excellent
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[12px] font-black text-amber-600 dark:text-amber-400">
                  <AlertCircle size={14} />
                  Needs Attention
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthlyCloseSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="flex justify-between items-center">
      <div className="space-y-3">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
      </div>
      <div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      ))}
    </div>

    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] h-[400px]" />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
    </div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-full" />
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin absolute inset-0" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Loading Monthly Close...</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="min-h-screen p-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] text-center">
        <ArrowDownRight className="w-12 h-12 text-red-500 mx-auto mb-6 rotate-45" />
        <h3 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-widest mb-2">
          Unable to Load Report
        </h3>
        <p className="text-xs font-bold text-red-600 dark:text-red-800/70 uppercase tracking-tight">
          {message}
        </p>
      </div>
    </div>
  );
};

export default MonthlyCloseReport;
