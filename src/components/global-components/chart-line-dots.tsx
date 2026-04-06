"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const title = "A line chart with dots";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface ChartLineDotsProps {
  className?: string;
  noWrapper?: boolean;
  data?: any[];
  dataKey?: string;
  config?: ChartConfig;
}

const ChartLineDots = ({ 
  className = "", 
  noWrapper = false, 
  data = chartData, 
  dataKey = "desktop",
  config = chartConfig
}: ChartLineDotsProps) => {
  const chartContent = (
    <ChartContainer config={config}>
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis
          axisLine={false}
          dataKey="date"
          tickFormatter={(value) => value && value.slice ? value.slice(0, 3) : value}
          tickLine={false}
          tickMargin={8}
          className="text-xs font-bold text-slate-400"
        />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          cursor={false}
        />
        <Line
          activeDot={{
            r: 6,
          }}
          dataKey={dataKey}
          dot={{
            fill: `var(--color-${dataKey})`,
          }}
          stroke={`var(--color-${dataKey})`}
          strokeWidth={2}
          type="natural"
        />
      </LineChart>
    </ChartContainer>
  );

  if (noWrapper) {
    return <div className={`w-full ${className}`}>{chartContent}</div>;
  }

  return (
    <div className={`w-full max-w-xl rounded-md border bg-background p-4 ${className}`}>
      {chartContent}
    </div>
  );
};

export default ChartLineDots;
