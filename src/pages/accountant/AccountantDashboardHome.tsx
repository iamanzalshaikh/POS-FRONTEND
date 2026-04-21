import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calculator,
  DollarSign,
  Landmark,
  Package,
  Percent,
  Scale,
  TrendingUp,
  Wallet,
  Activity
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Pie,
  PieChart as RePieChart,
  Cell
} from 'recharts';
import MetricCard from '@/components/global-components/MetricCard';
import PageHeader from '@/components/global-components/PageHeader';
import { formatCurrency, toLocalYMD } from '@/utils/format';
import { getFinanceSummary, getSalesReport } from '@/api/finance.api';
import { cn } from '@/lib/utils';
import { DashboardSkeleton } from "@/components/ui/skeletons/DashboardSkeleton";

export type AccountantPeriodPreset = 'today' | 'week' | 'month';

function getPeriodForPreset(preset: AccountantPeriodPreset): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = toLocalYMD(today);
  if (preset === 'today') {
    return { 
      startDate: endDate, 
      endDate 
    };
  }
  if (preset === 'week') {
    // Return last 7 days (including today)
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { startDate: toLocalYMD(start), endDate };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: toLocalYMD(start), endDate };
}

const AccountantDashboardHome: React.FC = () => {
  const [periodPreset, setPeriodPreset] = useState<AccountantPeriodPreset>('month');
  const { startDate, endDate } = getPeriodForPreset(periodPreset);

  // Queries
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
      queryKey: ['accountant-finance-summary', periodPreset],
      queryFn: () => getFinanceSummary({ startDate, endDate }),
      staleTime: 1000 * 60, // 1 minute
  });

  const { data: salesRes, isLoading: salesLoading } = useQuery({
      queryKey: ['accountant-finance-sales-report', periodPreset],
      queryFn: () => getSalesReport({ startDate, endDate }),
      staleTime: 1000 * 60, // 1 minute
  });

  const summary = summaryRes?.success ? summaryRes.data : null;
  const salesData = salesRes?.success ? salesRes.data.data : [];

  const marginDisplay = useMemo(() => {
    if (!summary || summary.grossMarginPercent === null) return '0%';
    return `${summary.grossMarginPercent > 0 ? '+' : ''}${summary.grossMarginPercent}%`;
  }, [summary]);

  const dailyRevenue = useMemo(() => {
      if (salesData?.length) {
          return salesData.map((r: any) => {
              // If it's an hourly string (e.g., "14:00"), use as is
              if (r.date.includes(':')) {
                  return {
                      label: r.date,
                      revenue: r.revenue,
                  };
              }
              
              // Otherwise, format as date
              return {
                  label: new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                  }),
                  revenue: r.revenue,
              };
          });
      }
      return [];
  }, [salesRes]);

  const loading = summaryLoading || salesLoading;

  const pieRows = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'COGS', value: summary.cogs, color: '#2563eb' },
      { name: 'Operating', value: summary.operatingExpenses, color: '#10b981' },
      { name: 'Salaries', value: summary.salaries, color: '#f59e0b' },
      { name: 'Sourcing Paid', value: summary.totalStockPaid, color: '#8b5cf6' },
    ].filter(r => r.value > 0);
  }, [summary]);

  const customCalculations = useMemo(() => {
     if (!summary) return { totalExpenses: 0, netMarginAmount: 0, netMarginPercent: 0 };
     
     // Card 11 calculation: Operating + Staff Payroll + Supplier Cash Paid
     const totalExpenses = (summary.operatingExpenses || 0) + 
                          (summary.salaries || 0) + 
                          (summary.totalStockPaid || 0);
     
     // Card 12 calculation: Total Revenue (Card 10) - Total Expense (Card 11)
     const netMarginAmount = (summary.totalRevenue || 0) - totalExpenses;
     const netMarginPercent = (summary.totalRevenue || 0) > 0 
                                ? (netMarginAmount / summary.totalRevenue) * 100 
                                : 0;
     
     return { totalExpenses, netMarginAmount, netMarginPercent };
  }, [summary]);



  const presetBtn = (preset: AccountantPeriodPreset, label: string) => (
    <button
      type="button"
      onClick={() => setPeriodPreset(preset)}
      className={cn(
        'relative px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-lg',
        periodPreset === preset
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 dark:shadow-none translate-y-[-1px]'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
      )}
    >
      {label}
    </button>
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Financial Intelligence Unit"
        className="mb-10"
      >
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {presetBtn('today', 'Today')}
          {presetBtn('week', 'Weekly')}
          {presetBtn('month', 'Monthly')}
        </div>
      </PageHeader>

      {/* Main Stats Grid - Consolidated KPIs */}
      {/* Main Stats Grid - Detailed Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Total Sales (Net)"
          value={summary?.totalRevenue ?? 0}
          isCurrency={true}
          icon={DollarSign}
          change={summary?.revenueChange}
          isPositive={summary ? (summary.revenueChange ?? 0) >= 0 : true}
          colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50"
        />
        <MetricCard
          title="Cost of Sales (COGS)"
          value={summary?.cogs ?? 0}
          isCurrency={true}
          icon={Package}
          colorClass="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/30 dark:border-slate-700/50"
        />
        <MetricCard
          title="Gross Profit"
          value={summary?.grossProfit ?? 0}
          isCurrency={true}
          icon={TrendingUp}
          colorClass={cn(
            "border-emerald-100 dark:border-emerald-900/50",
            (summary?.grossProfit ?? 0) >= 0 
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
          )}
          subtitle={`Margin: ${marginDisplay}`}
        />
        <MetricCard
          title="Operating Expenses"
          value={summary?.operatingExpenses ?? 0}
          isCurrency={true}
          icon={Calculator}
          colorClass="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
        />
        <MetricCard
          title="Staff Payroll"
          value={summary?.salaries ?? 0}
          isCurrency={true}
          icon={Wallet}
          subtitle={`Source: ${summary?.salariesSource || 'N/A'}`}
          colorClass="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50"
        />
        <MetricCard
          title="Tax Liability"
          value={summary?.taxLiability ?? 0}
          isCurrency={true}
          icon={Percent}
          colorClass="bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/50"
        />
        <MetricCard
          title="Inventory Sourcing"
          value={summary?.totalStockProcurement ?? 0}
          isCurrency={true}
          icon={Package}
          colorClass="bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:border-violet-900/50"
        />
        <MetricCard
          title="Supplier Cash Paid"
          value={summary?.totalStockPaid ?? 0}
          isCurrency={true}
          icon={Wallet}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
        />
        <MetricCard
          title="Supplier Payables"
          value={summary?.outstandingPayables ?? 0}
          isCurrency={true}
          icon={Activity}
          colorClass={cn(
            "border-orange-100 dark:border-orange-900/50",
            (summary?.outstandingPayables ?? 0) > 0 
              ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 font-bold" 
              : "bg-slate-50 text-slate-400 dark:bg-slate-900/30"
          )}
          subtitle={(summary?.outstandingPayables ?? 0) > 0 ? "Pending Payment" : "All Settled"}
        />
        <MetricCard
          title="Total Revenue"
          value={summary?.totalRevenue ?? 0}
          isCurrency={true}
          icon={Activity}
          colorClass="bg-slate-900 text-white shadow-lg shadow-slate-200 dark:shadow-none"
        />
        <MetricCard
          title="Total Expenses"
          value={customCalculations.totalExpenses}
          isCurrency={true}
          icon={Scale}
          subtitle="Operating + Staff + Sourcing Paid"
          colorClass="bg-red-50 text-red-600 border-red-100 dark:bg-rose-950/30 dark:border-rose-900/50"
        />
        <MetricCard
          title="Net Margin"
          value={customCalculations.netMarginAmount}
          isCurrency={true}
          icon={TrendingUp}
          subtitle={`Margin: ${customCalculations.netMarginPercent.toFixed(1)}%`}
          colorClass={cn(
            "border-indigo-100 dark:border-indigo-900/50",
            customCalculations.netMarginAmount >= 0 
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
          )}
        />
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Trend - Area Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-15 transition-opacity">
            <Activity className="w-28 h-28 text-indigo-500/20" strokeWidth={1} />
          </div>
          <div className="mb-10 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction Pulse</h3>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1 uppercase">Revenue Velocity</p>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  minTickGap={30}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  width={40}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                  tickFormatter={val => val >= 1000 ? `${(val / 1000).toFixed(0)}K` : `${val}`}
                />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                />
                <Area 
                  type="basis" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={5} 
                  fillOpacity={1} 
                  strokeLinecap="round"
                  fill="url(#dashRev)" 
                  dot={false}
                  activeDot={{ r: 8, fill: '#4f46e5', strokeWidth: 4, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution - Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-all duration-500 hover:shadow-md">
          <div className="mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capital Flow</h3>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase">Expense Distribution</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
             {pieRows.length > 0 ? (
               <>
                <ResponsiveContainer width="100%" height={240}>
                  <RePieChart>
                    <Pie
                      data={pieRows}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieRows.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-1 gap-3 w-full mt-8">
                  {pieRows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:translate-x-1 cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{r.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(r.value)}</span>
                    </div>
                  ))}
                </div>
               </>
             ) : (
               <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Waiting for period data...</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Visual Components --- */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
        <div className="flex items-center gap-3">
          <div className="size-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
          <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(payload[0].value)}</span>
        </div>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
          <span className="text-[9px] font-black uppercase tracking-widest">{payload[0].name}</span>
        </div>
        <p className="text-xs font-black tabular-nums">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default AccountantDashboardHome;
