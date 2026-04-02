"use client";

import React from 'react';
import { Bar, BarChart, XAxis, ResponsiveContainer } from 'recharts';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  activity: {
    label: 'Activity',
    color: 'var(--chart-1)',
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
}

const MonthlyActivityChart: React.FC<MonthlyActivityChartProps> = ({
  data,
  isLoading = false,
  title = "Monthly Activity",
  subtitle = "Last 12 months",
  height = 250
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
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>

      <div style={{ height }}>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={10} />
              <Bar dataKey="activity" fill="var(--chart-1)" radius={4} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: any) => (
                      <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium text-foreground tabular-nums">
                          {value}
                          <span className="font-normal text-muted-foreground ml-1">activity</span>
                        </div>
                      </div>
                    )}
                    hideLabel
                  />
                }
                cursor={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default MonthlyActivityChart;