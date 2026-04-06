"use client"

import * as React from "react"
import { Label, Pie, PieChart as ReChartsPieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export interface GlobalPieChartProps {
  data: any[]
  config?: ChartConfig
  dataKey?: string
  nameKey?: string
  title?: string
  subtitle?: string
  compact?: boolean
  noWrapper?: boolean
  centerLabel?: string | number
  innerRadius?: number
  outerRadius?: number
  className?: string
}

export const GlobalPieChart: React.FC<GlobalPieChartProps> = ({
  data,
  config = {},
  dataKey = "value",
  nameKey = "name",
  title,
  subtitle,
  compact = false,
  noWrapper = false,
  centerLabel,
  innerRadius = 60,
  outerRadius = 80,
  className = "",
}) => {
  const chartContent = (
    <ChartContainer
      config={config}
      className={compact ? "mx-auto aspect-square max-h-[250px]" : "mx-auto aspect-square max-h-[300px]"}
    >
      <ReChartsPieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          strokeWidth={5}
        >
          {centerLabel && (
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-slate-900 text-3xl font-black uppercase tracking-tight"
                      >
                        {centerLabel}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 24}
                        className="fill-slate-500 text-xs font-bold uppercase tracking-widest"
                      >
                         Total Node Units
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          )}
        </Pie>
      </ReChartsPieChart>
    </ChartContainer>
  )

  if (noWrapper) {
    return <div className={className}>{chartContent}</div>
  }

  return (
    <Card className={`flex flex-col shadow-sm border-slate-100 ${className}`}>
      {(title || subtitle) && (
        <CardHeader className="items-center pb-0">
          {title && <CardTitle className="text-slate-900 font-extrabold tracking-tight">{title}</CardTitle>}
          {subtitle && <CardDescription className="font-medium text-slate-500">{subtitle}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex-1 pb-0">{chartContent}</CardContent>
    </Card>
  )
}

export default GlobalPieChart
