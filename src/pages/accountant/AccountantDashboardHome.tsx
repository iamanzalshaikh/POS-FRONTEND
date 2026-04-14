import React, { useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  FileText,
  Landmark,
  Package,
  Percent,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Cell, Pie, PieChart } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import MetricCard from '@/components/global-components/MetricCard';
import GlobalPieChart from '@/components/global-components/PieChart';
import BarChartLabelCustom from '@/components/global-components/BarChartLabelCustom';
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

const barConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#262255' },
};

const pieConfig: ChartConfig = {
  cogs: { label: 'COGS', color: '#262255' },
  operating: { label: 'Operating expenses', color: '#6366f1' },
  salaries: { label: 'Salaries', color: '#f59e0b' },
};

function salariesSubtitle(source: FinanceSummaryData['salariesSource']): string | undefined {
  if (source === 'PAYROLL') return 'Payroll runs';
  if (source === 'EXPENSES') return 'Expense categories';
  if (source === 'NONE') return 'No salary line in period';
  return undefined;
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
    const rows = [
      { key: 'cogs' as const, name: 'COGS', value: summary.cogs },
      { key: 'operating' as const, name: 'Operating', value: summary.operatingExpenses },
      { key: 'salaries' as const, name: 'Salaries', value: summary.salaries },
    ];
    return rows.filter((r) => r.value >= 0.01);
  }, [summary]);

  const marginDisplay =
    summary?.grossMarginPercent != null && Number.isFinite(summary.grossMarginPercent)
      ? `${summary.grossMarginPercent.toFixed(1)}%`
      : '—';

  const presetBtn = (preset: AccountantPeriodPreset, label: string, hint: string) => (
    <button
      type="button"
      title={hint}
      onClick={() => onPeriodPresetChange(preset)}
      className={cn(
        'rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all sm:px-3 sm:py-2 sm:text-[11px] sm:tracking-widest',
        periodPreset === preset
          ? 'bg-[#262255] text-white shadow-md'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      )}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 w-full max-w-[280px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 sm:h-11" />
        </div>
        <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[118px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 sm:min-h-[124px]"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          <div className="min-h-[300px] rounded-3xl bg-slate-100 dark:bg-slate-800" />
          <div className="min-h-[300px] rounded-3xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white normal-case">
          Dashboard
        </h1>
        <div
          className="flex w-full max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:w-auto sm:shrink-0"
          role="group"
          aria-label="Report period"
        >
          {presetBtn('today', 'Today', 'Current calendar day')}
          {presetBtn('week', 'This week', 'Monday through today')}
          {presetBtn('month', 'This month', '1st of month through today')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total revenue"
          value={formatCurrency(summary?.totalRevenue ?? 0)}
          icon={DollarSign}
          change={summary != null ? Math.abs(summary.revenueChange) : undefined}
          isPositive={summary != null ? summary.revenueChange >= 0 : true}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="COGS"
          value={formatCurrency(summary?.cogs ?? 0)}
          icon={Package}
          colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
        />
        <MetricCard
          title="Gross profit"
          value={formatCurrency(summary?.grossProfit ?? 0)}
          icon={Scale}
          colorClass="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
        />
        <MetricCard
          title="Gross margin"
          value={marginDisplay}
          icon={Percent}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300"
        />
        <MetricCard
          title="Operating expenses"
          value={formatCurrency(summary?.operatingExpenses ?? 0)}
          icon={Landmark}
          colorClass="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
        />
        <MetricCard
          title="Salaries"
          value={formatCurrency(summary?.salaries ?? 0)}
          icon={Wallet}
          subtitle={summary ? salariesSubtitle(summary.salariesSource) : undefined}
          colorClass="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
        />
        <MetricCard
          title="Total costs"
          value={formatCurrency(summary?.totalExpenses ?? 0)}
          icon={Calculator}
          subtitle="COGS + operating + salaries"
          change={summary != null ? Math.abs(summary.expensesChange) : undefined}
          isPositive={summary != null ? summary.expensesChange <= 0 : true}
          colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
        />
        <MetricCard
          title="Net profit"
          value={formatCurrency(summary?.netProfit ?? 0)}
          icon={TrendingUp}
          change={summary != null ? Math.abs(summary.profitChange) : undefined}
          isPositive={summary != null ? summary.profitChange >= 0 : true}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        {/* Temporarily commented out - can be re-enabled later */}
        {/* <MetricCard
          title="Tax liability"
          value={formatCurrency(summary?.taxLiability ?? 0)}
          icon={FileText}
          subtitle="On completed sales in period"
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        /> */}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <div className="flex min-h-[300px] flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:min-h-0">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white normal-case">
              Revenue by day
            </h2>
          </div>
          {dailyRevenue.length > 0 ? (
            <div className="min-h-0 flex-1">
              <BarChartLabelCustom
                data={dailyRevenue}
                dataKey="revenue"
                labelKey="label"
                config={barConfig}
                noWrapper
                height="min-h-[240px] h-full"
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-400">
              No sales in this period
            </div>
          )}
        </div>

        <div className="flex min-h-[300px] flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:min-h-0">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white normal-case">
              Cost mix
            </h2>
          </div>
          {pieRows.length > 0 ? (
            <div className="flex-1">
              <GlobalPieChart
                data={pieRows}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={3}
                noWrapper
                compact
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm font-medium text-slate-400">
              No cost breakdown for this period
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboardHome;
