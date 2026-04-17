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

const ProfitLossReport: React.FC = () => {
  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
  }, []);

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
        if (exp.category === 'SUPPLIER_PURCHASE' || exp.category === 'SALARIES') return;
        const expDate = new Date(exp.date);
        if (expDate >= startDate && expDate <= endDate) {
          const weekKey = getWeekKey(exp.date);
          const existing = weeklyMap.get(weekKey) || { revenue: 0, expense: 0, profit: 0 };
          weeklyMap.set(weekKey, { ...existing, expense: existing.expense + Number(exp.amount) });
        }
      });
    }

    const cogsRatio = pnlRes.data.revenue > 0 ? pnlRes.data.cogs / pnlRes.data.revenue : 0;
    const sortedWeeks = Array.from(weeklyMap.keys()).sort((a, b) => 
      new Date(a + ', ' + new Date().getFullYear()).getTime() - 
      new Date(b + ', ' + new Date().getFullYear()).getTime()
    );

    const formatted = sortedWeeks.map(week => {
      const vals = weeklyMap.get(week)!;
      const weeklyCogs = vals.revenue * cogsRatio;
      return {
        month: week,
        revenue: vals.revenue,
        expense: vals.expense + weeklyCogs,
        profit: vals.revenue - weeklyCogs - vals.expense
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
        <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-fit">
          <Calendar size={18} className="text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {formatDate(data.period.startDate)} — {formatDate(data.period.endDate)}
          </span>
        </div>
      </PageHeader>

      {/* Metric Grid - High Density Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        <MetricCard title="Gross Profit" value={formatCurrency(data.grossProfit)} icon={DollarSign} colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" />
        <MetricCard title="Operating Expenses" value={formatCurrency(data.operatingExpenses)} icon={ArrowDownRight} colorClass="bg-red-50 text-red-600 border-red-100" />
        <MetricCard title="Net Profit" value={formatCurrency(data.netProfit)} icon={TrendingUp} colorClass="bg-blue-50 text-blue-600 border-blue-100" />
        <MetricCard title="Net Margin" value={`${data.netMargin.toFixed(1)}%`} icon={PieChart} colorClass="bg-indigo-50 text-indigo-600 border-indigo-100" />
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
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Profit</span>
                 </div>
              </div>
            </div>
            <ProfitLossChart data={chartData} height="h-[400px]" />
          </div>

          {/* Secondary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <InfoBox title="Margin Efficiency">
              <InfoRow label="Gross Margin" value={`${data.grossMargin.toFixed(1)}%`} valueClass="text-emerald-600" />
              <InfoRow label="Opex Ratio" value={`${data.expenseRatio.toFixed(1)}%`} valueClass="text-red-600" />
              <InfoRow label="Net Margin" value={`${data.netMargin.toFixed(1)}%`} valueClass="text-blue-600" />
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
            
            <div className="p-8 flex-grow space-y-10 custom-scrollbar overflow-y-auto max-h-[700px]">
              <StatementSection title="Gross Revenue" amount={data.revenue} color="text-emerald-600" symbol="+" />
              
              <StatementSection 
                title="Cost of Goods (COGS)" 
                amount={data.cogs} 
                color="text-red-500" 
                symbol="-" 
                subtext="Direct unit cost formula"
              />

              <StatementSection title="Operating Overhead" amount={data.operatingExpenses + data.salaries} color="text-red-500" symbol="-" isList>
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Opex (Excl. Salaries)</span>
                    <span className="font-black text-slate-800 dark:text-white">{formatCurrency(data.operatingExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Salaries ({data.salariesSource})</span>
                    <span className="font-black text-slate-800 dark:text-white">{formatCurrency(data.salaries)}</span>
                  </div>
                </div>
              </StatementSection>

              {/* Bottom Total Widget */}
              <div className="pt-10">
                 <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 mb-2">Calculated Net Profit</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(data.netProfit)}</span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${data.netMargin > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {data.netMargin > 0 ? '+' : ''}{data.netMargin.toFixed(1)}% Efficiency
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

const StatementSection = ({ title, amount, color, symbol, subtext, children, isList }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div className="max-w-[180px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{title}</h4>
        {subtext && <p className="text-[9px] text-slate-400 italic leading-tight">{subtext}</p>}
      </div>
      <span className={`text-sm font-black ${color} tabular-nums`}>{symbol}{formatCurrency(amount)}</span>
    </div>
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
      {!isList ? (
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest">Aggregate Total</span>
          <span className="font-black text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
        </div>
      ) : children}
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
