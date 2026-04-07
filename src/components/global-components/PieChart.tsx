"use client";

import { LabelList, Pie, PieChart, Cell, Tooltip, Label } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
              {config && Object.keys(config).length > 0 ? (
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel nameKey={dataKey} />}
                />
              ) : (
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', padding: '16px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(8px)' }} 
                  itemStyle={{ fontWeight: 900, fontSize: '14px', color: '#0F172A' }} 
                  labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#94A3B8', marginBottom: '8px' }} 
                />
              )}
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
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-3xl font-extrabold">{centerLabel}</tspan>
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
