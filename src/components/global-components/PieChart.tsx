"use client";

import { LabelList, Pie, PieChart, Cell, Tooltip, Label } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatNumberShort } from "@/utils/format";

interface GlobalPieChartProps {
  data: any[];
  config?: ChartConfig;
  dataKey: string;
  nameKey: string;
  title?: string;
  subtitle?: string;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  showLabels?: boolean;
  noWrapper?: boolean;
  centerLabel?: string | number;
  compact?: boolean;
}

export default function GlobalPieChart({
  data,
  config = {},
  dataKey,
  nameKey,
  title,
  subtitle,
  innerRadius = 70,
  outerRadius = 95,
  paddingAngle = 10,
  showLabels = true,
  noWrapper = false,
  centerLabel,
  compact = false,
}: GlobalPieChartProps) {
  const total = data.reduce((a, b) => a + (b[dataKey] || 0), 0);

  const chartContent = (
    <>
      {(title || subtitle) && (
        <div className={`flex items-center justify-between ${compact ? 'mb-4' : 'mb-8'}`}>
          <div>
            {title && <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && (
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
        <ChartContainer className={`${compact ? 'h-[200px]' : 'h-[280px]'} w-full`} config={config}>
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const color = payload[0].payload.color || `var(--chart-${(payload[0].payload.index % 5) + 1})`;
                    return (
                      <div 
                        className="px-4 py-3 rounded-2xl shadow-xl border-none text-white backdrop-blur-md transition-all duration-300"
                        style={{ backgroundColor: color }}
                      >
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{payload[0].name}</p>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-sm font-black">{formatNumberShort(payload[0].value as number)}</p>
                          <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">
                            {total > 0 ? `(${( (Number(payload[0].value) / total) * 100).toFixed(1)}%)` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={paddingAngle}
                dataKey={dataKey}
                animationBegin={500}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `var(--chart-${(index % 5) + 1})`}
                    stroke="none"
                  />
                ))}
                {showLabels && (
                  <LabelList
                    className="fill-background"
                    dataKey={nameKey}
                    fontSize={12}
                    formatter={(value: any) =>
                      config[value as keyof typeof config]?.label || value
                    }
                    stroke="none"
                  />
                )}
                {centerLabel && (
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-3xl font-extrabold">
                              {typeof centerLabel === 'number' ? formatNumberShort(centerLabel) : centerLabel}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-slate-500 font-bold text-xs uppercase tracking-widest">Total</tspan>
                          </text>
                        )
                      }
                    }}
                   />
                )}
              </Pie>
            </PieChart>
        </ChartContainer>
      <div className={`grid grid-cols-2 ${compact ? 'gap-2 mt-4' : 'gap-4 mt-8'}`}>
        {data.map((cat, idx) => (
          <div key={idx} className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-3'} bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all`}>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: cat.color || `var(--chart-${(idx % 5) + 1})` }}
            ></div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                {cat[nameKey]}
              </p>
              <p className="text-sm font-black text-slate-900 tabular-nums">
                {total > 0 ? (((cat[dataKey] || 0) / total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (noWrapper) {
    return <div className="h-full flex flex-col">{chartContent}</div>;
  }

  return (
    <div className={`bg-white ${compact ? 'p-5' : 'p-8'} rounded-[32px] border border-slate-100 shadow-sm flex flex-col ${compact ? 'h-fit' : 'h-full'} hover:shadow-lg transition-all duration-300`}>
      {chartContent}
    </div>
  );
}
