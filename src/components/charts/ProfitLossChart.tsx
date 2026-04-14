import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import type { ChartConfig } from "../ui/chart";

export interface ProfitLossData {
  month: string;
  revenue: number;
  expense: number;
  profit: number;
}

interface ProfitLossChartProps {
  data: ProfitLossData[];
  className?: string;
  height?: string;
}

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1, 220 70% 50%))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2, 0 70% 50%))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3, 142 70% 45%))",
  },
};

export function ProfitLossChart({ data, className, height = "h-[400px]" }: ProfitLossChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${height}`}>
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={className}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          className="text-xs"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
        />
        <Bar
          dataKey="revenue"
          fill={chartConfig.revenue.color}
          radius={[4, 4, 0, 0]}
          name="Revenue"
        />
        <Bar
          dataKey="expense"
          fill={chartConfig.expense.color}
          radius={[4, 4, 0, 0]}
          name="Expense"
        />
        <Bar
          dataKey="profit"
          fill={chartConfig.profit.color}
          radius={[4, 4, 0, 0]}
          name="Profit"
        />
      </BarChart>
    </ChartContainer>
  );
}
