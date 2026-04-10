import React from 'react';
import { Area, AreaChart, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  activity: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const defaultChartData = [
  { month: 'Jan', activity: 400 },
  { month: 'Feb', activity: 300 },
  { month: 'Mar', activity: 500 },
  { month: 'Apr', activity: 200 },
  { month: 'May', activity: 600 },
  { month: 'Jun', activity: 450 },
  { month: 'Jul', activity: 380 },
  { month: 'Aug', activity: 520 },
  { month: 'Sep', activity: 410 },
  { month: 'Oct', activity: 470 },
  { month: 'Nov', activity: 530 },
  { month: 'Dec', activity: 610 },
];

interface ChartDataPoint {
  month: string;
  activity: number;
}

interface MonthlyActivityChartProps {
  data?: ChartDataPoint[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  height?: number | string;
  className?: string;
  unit?: string;
  isCurrency?: boolean;
}

const MonthlyActivityChart: React.FC<MonthlyActivityChartProps> = ({
  data,
  isLoading = false,
  title = "Monthly Performance",
  subtitle = "Last 6 months",
  height = 250,
  className,
  unit = "activity",
  isCurrency = false
}) => {
  const displayData = data || defaultChartData;

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm dark:bg-slate-950 dark:border-slate-800 flex flex-col items-center justify-center min-h-[280px] animate-pulse">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Growth Data...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-all hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></span>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Flow</span>
        </div>
      </div>

      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickMargin={10} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-800/50 backdrop-blur-md">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.month}</p>
                      <p className="text-sm font-black">
                        {isCurrency ? `₨ ${Number(payload[0].value).toLocaleString()}` : payload[0].value}
                        <span className="text-[10px] font-medium text-slate-400 ml-1.5 uppercase tracking-tighter">{unit}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="activity"
              stroke="#4F46E5"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorActivity)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyActivityChart;