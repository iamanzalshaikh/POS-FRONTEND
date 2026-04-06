"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BarChartLabelCustomProps {
  data: any[];
  config: ChartConfig;
  dataKey: string;
  labelKey: string;
  noWrapper?: boolean;
  height?: string;
  className?: string;
}

const BarChartLabelCustom: React.FC<BarChartLabelCustomProps> = ({
  data,
  config,
  dataKey,
  labelKey,
  noWrapper = false,
  height = "h-[300px]",
  className = "",
}) => {
  const chartContent = (
    <ChartContainer config={config}>
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          top: 20,
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey={labelKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey={dataKey}
          fill={`var(--color-${dataKey})`}
          radius={8}
        >
          <LabelList
            position="top"
            offset={12}
            className="fill-slate-900 dark:fill-white font-bold text-[10px]"
            formatter={(value: number) => value.toLocaleString()}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );

  if (noWrapper) {
    return (
      <div className={`w-full ${height} ${className}`}>
        {chartContent}
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col ${height} ${className}`}>
      {chartContent}
    </div>
  );
};

export default BarChartLabelCustom;
