import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, TrendingUp, DollarSign, ArrowDownRight, Calendar, Loader2 } from 'lucide-react';
import { getProfitAndLoss, getSalesReport } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import type { ProfitLossData, SalesReportData } from '../../api/finance.api';
import type { Expense } from '../../utils/expense-utils';
import { formatCurrency } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { ProfitLossChart } from '../../components/charts/ProfitLossChart';
import type { ProfitLossData as ChartData } from '../../components/charts/ProfitLossChart';
import { cn } from '@/lib/utils';

const ProfitLossReport: React.FC = () => {
  const [periodPreset, setPeriodPreset] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    if (periodPreset === 'today') {
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
    }
    if (periodPreset === 'week') {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
    }
    if (periodPreset === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: end };
    }
    
    // Default 90 days for custom/old behavior
    const start = new Date(today);
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
    return { startDate: start, endDate: end };
  }, [periodPreset]);

  const sDateStr = startDate.toISOString().split('T')[0];
  const eDateStr = endDate.toISOString().split('T')[0];

  // Queries
  const { data: pnlRes, isLoading: pnlLoading, error: pnlError } = useQuery({
    queryKey: ['accountant-pnl-summary', sDateStr, eDateStr],
    queryFn: () => getProfitAndLoss({ startDate: sDateStr, endDate: eDateStr }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: salesRes, isLoading: salesLoading } = useQuery({
    queryKey: ['accountant-pnl-sales', sDateStr, eDateStr],
    queryFn: () => getSalesReport({ startDate: sDateStr, endDate: eDateStr }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: expRes, isLoading: expLoading } = useQuery({
    queryKey: ['accountant-pnl-expenses'],
    queryFn: () => getExpenses(),
    staleTime: 1000 * 60 * 10,
  });

  const loading = pnlLoading || salesLoading || expLoading;
  const data = pnlRes?.success ? pnlRes.data : null;
  const error = pnlError ? (pnlError as any).message : (!pnlRes?.success && pnlRes?.message ? pnlRes.message : null);

  const chartData = useMemo(() => {
    if (!pnlRes?.success || !pnlRes.data) return [];
    
    const salesData = (salesRes as any)?.data as SalesReportData;
    const expensesList = (expRes as any)?.data as Expense[];
    
    const weeklyMap = new Map<string, { revenue: number, expense: number, profit: number }>();
    const getWeekKey = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (salesData?.data) {
      salesData.data.forEach(day => {
        const weekKey = getWeekKey(day.date);
        const existing = weeklyMap.get(weekKey) || { revenue: 0, expense: 0, profit: 0 };
        weeklyMap.set(weekKey, { ...existing, revenue: existing.revenue + day.revenue });
      });
    }

    if (expensesList) {
      expensesList.forEach(exp => {
        // Skip SALARIES because it is handled separately below (weeklySalary)
        if (exp.category === 'SALARIES') return;
        const expDate = new Date(exp.date);
        if (expDate >= startDate && expDate <= endDate) {
          const weekKey = getWeekKey(exp.date);
          const existing = weeklyMap.get(weekKey) || { revenue: 0, expense: 0, profit: 0 };
          weeklyMap.set(weekKey, { ...existing, expense: existing.expense + Number(exp.amount) });
        }
      });
    }

    const sortedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => 
      new Date(a + ', ' + new Date().getFullYear()).getTime() - 
      new Date(b + ', ' + new Date().getFullYear()).getTime()
    );

    const weekCount = sortedWeeks.length || 1;
    const weeklySalary = (pnlRes.data.salaries || 0) / weekCount;

    const formatted = sortedWeeks.map(week => {
      const vals = weeklyMap.get(week)!;
      const totalWeeklyPaid = vals.expense + weeklySalary;
      
      return {
        month: week,
        revenue: vals.revenue,
        expense: totalWeeklyPaid,
        profit: vals.revenue - totalWeeklyPaid
      };
    });

    if (formatted.length === 1) {
      const single = formatted[0];
      const prev = new Date(new Date(single.month + ', ' + new Date().getFullYear()));
      prev.setDate(prev.getDate() - 7);
      return [{ month: prev.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, expense: 0, profit: 0 }, single];
    }
    return formatted.length === 0 ? [{ month: 'No Data', revenue: 0, expense: 0, profit: 0 }, { month: 'Today', revenue: 0, expense: 0, profit: 0 }] : formatted;
  }, [pnlRes, salesRes, expRes, startDate, endDate]);

  const customMetrics = useMemo(() => {
    if (!data) return null;
    const rev = data.revenue;
    const exps = data.operatingExpenses + data.salaries + (data.totalStockPaid || 0);
    const profit = rev - exps;
    const margin = rev > 0 ? (profit / rev) * 100 : 0;
    return { rev, exps, profit, margin };
  }, [data]);

  if (loading) return <ProfitLossSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Financial Statement"
        description="Real-time performance metrics"
        icon={PieChart}
      >
        <div className="flex items-center gap-4">
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['today', 'week', 'month'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => setPeriodPreset(preset)}
                className={cn(
                  'px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg',
                  periodPreset === preset
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 dark:shadow-none'
                    : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-fit">
            <Calendar size={18} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest tabular-nums">
              {formatDate(sDateStr)} — {formatDate(eDateStr)}
            </span>
          </div>
        </div>
      </PageHeader>

      {/* Metric Grid - High Density Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <MetricCard title="Total Revenue" value={formatCurrency(customMetrics?.rev ?? 0)} icon={DollarSign} colorClass="bg-blue-50 text-blue-600 border-blue-100" />
        <MetricCard title="Total Expenses" value={formatCurrency(customMetrics?.exps ?? 0)} icon={ArrowDownRight} subtitle="Opex + Staff + Sourcing Paid" colorClass="bg-red-50 text-red-600 border-red-100" />
        <MetricCard title="Net Profit" value={formatCurrency(customMetrics?.profit ?? 0)} icon={TrendingUp} colorClass={cn(
            "border-emerald-100 dark:border-emerald-900/50",
            (customMetrics?.profit ?? 0) >= 0 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
          )} />
        <MetricCard title="Net Margin" value={`${customMetrics?.margin.toFixed(1)}%`} icon={PieChart} colorClass="bg-indigo-50 text-indigo-600 border-indigo-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area - Chart & Stats */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dynamic Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monthly Performance Trend</h3>
                <p className="text-sm font-black text-slate-800 dark:text-white mt-1 uppercase tracking-tight">Revenue vs Operative Profit</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-600" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Revenue</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expenses</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Net Profit</span>
                 </div>
              </div>
            </div>
            <ProfitLossChart data={chartData} height="h-[400px]" />
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <InfoBox title="Performance Summary">
              <InfoRow label="Total Revenue" value={`${formatCurrency(customMetrics?.rev ?? 0)} (100%)`} valueClass="text-blue-600" />
              <InfoRow 
                label="Total Expenses" 
                value={`${formatCurrency(customMetrics?.exps ?? 0)} (${customMetrics?.rev ? ((customMetrics.exps / customMetrics.rev) * 100).toFixed(1) : 0}%)`} 
                valueClass="text-rose-600" 
              />
              <InfoRow 
                label="Net Profit" 
                value={`${formatCurrency(customMetrics?.profit ?? 0)} (${customMetrics?.margin.toFixed(1)}%)`} 
                valueClass="text-emerald-600" 
              />
            </InfoBox>
            
            <InfoBox title="Volume Indicators">
              <InfoRow label="Completed Sales" value={`${data.metrics.totalSales} txns`} />
              <InfoRow label="Active Ledger Entries" value={`${data.metrics.expenseEntryCount} records`} />
              <InfoRow label="Audit Period" value="Last Quarter" />
            </InfoBox>
          </div>
        </div>

        {/* Sidebar - Statement Breakdown */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col h-full border-b-8 border-b-blue-600/10">
            <div className="px-8 py-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Statement Breakdown</h2>
            </div>
            
            <div className="p-8 flex-grow space-y-8 custom-scrollbar overflow-y-auto max-h-[750px]">
              {/* 1. Core Revenue Section */}
              <div className="space-y-6">
                <BreakdownRow title="1. Total Sales (Net)" value={data.revenue} color="text-emerald-500" symbol="+" />
                <BreakdownRow title="2. Cost of Sales (COGS)" value={data.cogs} color="text-rose-500" symbol="-" />
                <BreakdownRow title="3. Gross Profit" value={data.revenue - data.cogs} color="text-emerald-600" symbol="=" />
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* 2. Operations Section */}
              <div className="space-y-6">
                <BreakdownRow title="4. Operating Expenses" value={data.operatingExpenses} color="text-rose-500" symbol="-" />
                <BreakdownRow title="5. Staff Payroll" value={data.salaries} color="text-rose-500" symbol="-" />
                <BreakdownRow title="6. Tax Liability" value={data.totalTax} color="text-rose-500" symbol="-" />
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* 3. Sourcing & Supply Section */}
              <div className="space-y-6">
                <BreakdownRow title="7. Inventory Sourcing" value={data.totalStockProcurement} color="text-slate-400" symbol="" />
                <BreakdownRow title="8. Supplier Cash Paid" value={data.totalStockPaid} color="text-rose-500" symbol="-" />
                <BreakdownRow title="9. Supplier Payables" value={data.outstandingPayables} color="text-orange-500" symbol="!" />
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              {/* 4. Final Totals Section */}
              <div className="space-y-6">
                <BreakdownRow title="10. Total Revenue" value={customMetrics?.rev ?? 0} color="text-blue-600" symbol="" isBold />
                <BreakdownRow title="11. Total Expenses" value={customMetrics?.exps ?? 0} color="text-rose-600" symbol="" isBold />
                
                {/* 12. Net Margin Widget */}
                <div className="pt-4">
                  <div className={cn(
                    "p-6 rounded-[2rem] shadow-xl relative overflow-hidden group transition-all duration-500",
                    (customMetrics?.profit ?? 0) >= 0 ? "bg-slate-900 shadow-emerald-900/10" : "bg-indigo-900 shadow-indigo-900/10"
                  )}>
                    <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10 text-center sm:text-left">
                       <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Net Margin</p>
                       <div className="flex flex-col gap-1">
                          <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                            {formatCurrency(customMetrics?.profit ?? 0)}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${(customMetrics?.margin ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                            {customMetrics?.margin.toFixed(1)}% Return
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Refined Internal Components --- */

const BreakdownRow = ({ title, value, color, symbol, isBold }: any) => (
  <div className="flex justify-between items-center group/row">
    <span className={cn(
      "text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/row:text-slate-600 transition-colors",
      isBold && "text-slate-900 dark:text-white"
    )}>{title}</span>
    <div className="flex items-center gap-2">
       <span className={cn("text-[10px] font-black opacity-40 px-1", color)}>{symbol}</span>
       <span className={cn(
         "text-[11px] font-black tabular-nums tracking-tight",
         color,
         isBold && "text-sm",
       )}>{formatCurrency(value || 0)}</span>
    </div>
  </div>
);

const InfoBox = ({ title, children }: any) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">{title}</h4>
    <div className="space-y-5">{children}</div>
  </div>
);

const InfoRow = ({ label, value, valueClass = "text-slate-900" }: any) => (
  <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    <span className={`text-[12px] font-black ${valueClass} tabular-nums`}>{value}</span>
  </div>
);

const ProfitLossSkeleton = () => (
  <div className="max-w-[1600px] mx-auto space-y-8 animate-pulse">
    <div className="flex flex-col gap-4">
      <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] h-[500px]" />
      <div className="lg:col-span-4 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] h-[500px]" />
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
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Ledger Vault...</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen p-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="max-w-md w-full p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] text-center">
       <ArrowDownRight className="w-12 h-12 text-red-500 mx-auto mb-6 rotate-45" />
       <h3 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-widest mb-2">Vault Access Denied</h3>
       <p className="text-xs font-bold text-red-600 dark:text-red-800/70 uppercase tracking-tight">{message}</p>
    </div>
  </div>
);

export default ProfitLossReport;
