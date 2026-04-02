import * as React from "react"
import { Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "../../lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
    icon?: React.ComponentType<any>
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactElement
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const style = React.useMemo(() => {
    const vars: Record<string, string> = {}
    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        vars[`--color-${key}`] = value.color
      }
    })
    return vars
  }, [config])

  return (
    <div
      className={cn("w-full h-full min-h-[200px]", className)}
      style={style as React.CSSProperties}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export const ChartTooltip = Tooltip
export const ChartLegend = Legend

export function ChartLegendContent({
  payload,
  verticalAlign = "bottom",
  align = "center",
  className,
}: any) {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4 pt-2",
        verticalAlign === "top" ? "pb-2" : "pt-2",
        align === "left" && "justify-start",
        align === "right" && "justify-end",
        className
      )}
    >
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  formatter,
}: any) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className={cn("rounded-lg border bg-white p-3 shadow-sm min-w-[150px]", className)}>
      {!hideLabel && (
        <div className="mb-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item: any, index: number) => {
          if (formatter) {
            return (
              <div key={index}>
                {formatter(item.value, item.name, item, index, payload)}
              </div>
            )
          }

          return (
            <div
              key={index}
              className="flex w-full items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2">
                {indicator === "dot" && (
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {indicator === "dashed" && (
                  <div
                    className="h-0.5 w-3 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="font-bold text-slate-500 capitalize text-xs">
                  {item.name}
                </span>
              </div>
              <span className="font-black text-slate-900 tabular-nums text-sm">₹{Number(item.value).toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
