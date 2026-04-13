import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, ArrowDownRight, Calendar, FileText } from 'lucide-react';
import { getProfitAndLoss } from '../../api/finance.api';
import type { ProfitLossData } from '../../api/finance.api';
import { formatCurrency as formatCurrencyUtil } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

const ProfitLossReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfitLossData = async () => {
      try {
        setLoading(true);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);

        const response = await getProfitAndLoss({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to load P&L data');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load P&L data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLossData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPeriodLabel = () => {
    const days = Math.ceil((new Date(data!.period.endDate).getTime() - new Date(data!.period.startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 31) return 'Last Month';
    if (days <= 93) return 'Last Quarter';
    if (days <= 186) return 'Last 6 Months';
    return 'Last 12 Months';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm font-bold text-slate-500">Loading P&L statement...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-red-600">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  // Column definitions
  const itemColumns: ColumnDef<{ label: string; value: string }>[] = [
    {
      header: "Item",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.label}
        </div>
      ),
      meta: { align: 'center' }
    },
    {
      header: "Value",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.value}
        </div>
      ),
      meta: { align: 'center' }
    }
  ];

  const expenseColumns: ColumnDef<{ category: string; amount: number; percentage: number }>[] = [
    {
      header: "Category",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.category}
        </div>
      ),
      meta: { align: 'center' }
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrencyUtil(row.original.amount)}
        </div>
      ),
      meta: { align: 'center' }
    },
    {
      header: "Percentage",
      cell: ({ row }) => (
        <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.percentage.toFixed(1)}%
        </div>
      ),
      meta: { align: 'center' }
    }
  ];

  const expenseData = Object.entries(data.expenseByCategory).map(([category, amount]) => ({
    category,
    amount,
    percentage: data.operatingExpenses > 0 ? (amount / data.operatingExpenses) * 100 : 0,
  }));

  const summaryData = [
    { label: "Revenue", value: formatCurrencyUtil(data.revenue) },
    { label: "Cost of Goods Sold", value: `-${formatCurrencyUtil(data.cogs)}` },
    { label: "Gross Profit", value: formatCurrencyUtil(data.grossProfit) },
    { label: "Operating Expenses", value: `-${formatCurrencyUtil(data.operatingExpenses)}` },
    { label: "Net Profit", value: formatCurrencyUtil(data.netProfit) },
  ];

  const metricsData = [
    { label: "Gross Profit Margin", value: `${data.grossMargin.toFixed(1)}%` },
    { label: "Operating Expense Ratio", value: `${data.expenseRatio.toFixed(1)}%` },
    { label: "Net Profit Margin", value: `${data.netMargin.toFixed(1)}%` },
  ];

  const periodData = [
    { label: "Start Date", value: formatDate(data.period.startDate) },
    { label: "End Date", value: formatDate(data.period.endDate) },
    { label: "Total Sales", value: `${data.metrics.totalSales} transactions` },
    { label: "Total Expenses", value: `${data.metrics.totalExpenses} records` },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <FileText size={28} className="text-blue-400" />
              Profit & Loss Statement
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-2">Comprehensive financial performance report</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{getPeriodLabel()}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Gross Profit"
          value={formatCurrencyUtil(data.grossProfit)}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Operating Expenses"
          value={formatCurrencyUtil(data.operatingExpenses)}
          icon={ArrowDownRight}
          colorClass="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrencyUtil(data.netProfit)}
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Profit Margin"
          value={`${data.netMargin.toFixed(1)}%`}
          icon={PieChart}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
      </div>

      {/* Detailed Breakdown - 3 Square Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
          <DataTable
            columns={itemColumns}
            data={[{ label: "Product Sales", value: formatCurrencyUtil(data.revenue) }]}
            hidePagination={true}
            placeholder="Search revenue..."
          />
        </div>

        {/* COGS */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
          <DataTable
            columns={itemColumns}
            data={[{ label: "Cost of Goods Sold", value: `-${formatCurrencyUtil(data.cogs)}` }]}
            hidePagination={true}
            placeholder="Search COGS..."
          />
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
          <DataTable
            columns={expenseColumns}
            data={expenseData}
            hidePagination={true}
            placeholder="Search expenses..."
          />
        </div>
      </div>

      {/* Profit Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
        <DataTable
          columns={itemColumns}
          data={summaryData}
          hidePagination={true}
          placeholder="Search summary..."
        />
      </div>

      {/* Financial Metrics & Period Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
          <DataTable
            columns={itemColumns}
            data={metricsData}
            hidePagination={true}
            placeholder="Search metrics..."
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
          <DataTable
            columns={itemColumns}
            data={periodData}
            hidePagination={true}
            placeholder="Search period..."
          />
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReport;
