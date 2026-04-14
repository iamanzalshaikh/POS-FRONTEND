import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

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

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#2563eb", // blue-600
  },
  expense: {
    label: "Expense",
    color: "#e11d48", // rose-600
  },
  profit: {
    label: "Profit",
    color: "#10b981", // emerald-500
  },
};

export function ProfitLossChart({ data, className, height = "h-[400px]" }: ProfitLossChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", height, className)}>
        <p className="text-slate-400 text-sm font-black uppercase tracking-widest">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn(height, "w-full min-w-0 font-sans", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.revenue.color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={chartConfig.revenue.color} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.profit.color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={chartConfig.profit.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
                    <div className="space-y-2">
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{entry.name}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">
                            Rs {entry.value.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={chartConfig.revenue.color}
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorRev)"
            name="Revenue"
            dot={{ r: 4, fill: chartConfig.revenue.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke={chartConfig.profit.color}
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorProfit)"
            name="Profit"
            dot={{ r: 4, fill: chartConfig.profit.color, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke={chartConfig.expense.color}
            strokeWidth={2}
            strokeDasharray="4 4"
            fill="transparent"
            name="Expense"
            dot={{ r: 3, fill: chartConfig.expense.color, strokeWidth: 2, stroke: '#fff' }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

