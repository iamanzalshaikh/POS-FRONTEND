import React, { useMemo } from 'react';
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
import { formatCurrency } from '@/utils/format';
import type { FinanceSummaryData } from '@/api/finance.api';
import { cn } from '@/lib/utils';

export type AccountantPeriodPreset = 'today' | 'week' | 'month';

export interface AccountantDashboardHomeProps {
  summary: FinanceSummaryData | null;
  dailyRevenue: Array<{ label: string; revenue: number }>;
  loading: boolean;
  periodPreset: AccountantPeriodPreset;
  onPeriodPresetChange: (preset: AccountantPeriodPreset) => void;
}

const AccountantDashboardHome: React.FC<AccountantDashboardHomeProps> = ({
  summary,
  dailyRevenue,
  loading,
  periodPreset,
  onPeriodPresetChange,
}) => {
  const pieRows = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'COGS', value: summary.cogs, color: '#2563eb' },
      { name: 'Operating', value: summary.operatingExpenses, color: '#10b981' },
      { name: 'Salaries', value: summary.salaries, color: '#f59e0b' },
    ].filter(r => r.value > 0);
  }, [summary]);

  const marginDisplay =
    summary?.grossMarginPercent != null && Number.isFinite(summary.grossMarginPercent)
      ? `${summary.grossMarginPercent.toFixed(1)}%`
      : '0%';

  const presetBtn = (preset: AccountantPeriodPreset, label: string) => (
    <button
      type="button"
      onClick={() => onPeriodPresetChange(preset)}
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

  if (loading) return <LoadingState />;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase transition-all">
            Dashboard
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Financial Intelligence Unit</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          {presetBtn('today', 'Today')}
          {presetBtn('week', 'Weekly')}
          {presetBtn('month', 'Monthly')}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Gross Revenue"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={DollarSign}
          change={summary?.revenueChange}
          isPositive={summary ? summary.revenueChange >= 0 : true}
          colorClass="bg-blue-50 text-blue-600 border-blue-100"
        />
        <MetricCard
          title="Direct COGS"
          value={formatCurrency(summary?.cogs ?? 0)}
          icon={Package}
          colorClass="bg-slate-50 text-slate-700 border-slate-200"
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(summary?.grossProfit ?? 0)}
          icon={Scale}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <MetricCard
          title="Gross Margin"
          value={marginDisplay}
          icon={Percent}
          colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <MetricCard
          title="Operations"
          value={formatCurrency(summary?.operatingExpenses ?? 0)}
          icon={Landmark}
          colorClass="bg-orange-50 text-orange-700 border-orange-100"
        />
        <MetricCard
          title="Payroll Cost"
          value={formatCurrency(summary?.salaries ?? 0)}
          icon={Wallet}
          colorClass="bg-amber-50 text-amber-700 border-amber-100"
        />
        <MetricCard
          title="Total Burden"
          value={formatCurrency(summary?.totalExpenses ?? 0)}
          icon={Calculator}
          change={summary?.expensesChange}
          isPositive={summary ? summary.expensesChange <= 0 : true}
          colorClass="bg-rose-50 text-rose-600 border-rose-100"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(summary?.netProfit ?? 0)}
          icon={TrendingUp}
          change={summary?.profitChange}
          isPositive={summary ? summary.profitChange >= 0 : true}
          colorClass="bg-slate-900 text-white shadow-lg shadow-slate-200"
        />
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Trend - Area Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-24 h-24 text-blue-600" />
          </div>
          <div className="mb-10 relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transaction Pulse</h3>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase">Revenue Velocity</p>
          </div>
          
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                  tickFormatter={val => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#dashRev)" 
                  dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
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
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(payload[0].value)}</span>
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

const LoadingState = () => (
  <div className="max-w-[1600px] mx-auto p-10 space-y-10 animate-pulse">
    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-[2rem] w-full" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 h-[450px] bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      <div className="h-[450px] bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
    </div>
  </div>
);

export default AccountantDashboardHome;
