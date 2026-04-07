"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BarChartLabelCustomProps {
  data: any[];
  dataKey: string;
  labelKey: string;
  config?: ChartConfig;
  className?: string;
  noWrapper?: boolean;
  height?: string;
}

export default function BarChartLabelCustom({
  data,
  dataKey,
  labelKey,
  config = {},
  className = "",
  noWrapper = false,
  height = "min-h-[300px]",
}: BarChartLabelCustomProps) {
  const chartContent = (
    <ChartContainer config={config} className={`w-full ${height}`}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          left: 16,
          right: 40, // Space for the value label on the right
          top: 10,
          bottom: 10,
        }}
        barGap={10}
      >
        <CartesianGrid horizontal={false} stroke="#E2E8F0" opacity={0.5} />
        <YAxis
          dataKey={labelKey}
          type="category"
          tickLine={false}
          axisLine={false}
          hide
        />
        <XAxis type="number" hide />
        <ChartTooltip
          cursor={{ fill: "#F8FAFC", opacity: 0.8 }}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey={dataKey}
          fill={`var(--color-${dataKey})`}
          radius={8} // Rounded bars
          barSize={40}
        >
          {/* Custom Labels: Left -> label (month) */}
          <LabelList
            dataKey={labelKey}
            position="insideLeft"
            offset={12}
            className="fill-[var(--color-label)] font-bold text-sm"
          />
          {/* Custom Labels: Right -> value (desktop) */}
          <LabelList
            dataKey={dataKey}
            position="right"
            offset={12}
            className="fill-slate-900 font-black text-sm tabular-nums"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );

  if (noWrapper) {
    return <div className={`w-full ${className}`}>{chartContent}</div>;
  }

  return (
    <div className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 w-full ${className}`}>
      {chartContent}
    </div>
  );
}
