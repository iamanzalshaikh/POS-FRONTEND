"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Pie, PieChart, Label } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/Card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"

type ChartConfig = Record<string, { label: string; color?: string }>

const standardConfig = {
  desktop: { label: "Desktop", color: "#6366f1" },
  mobile: { label: "Mobile", color: "#818cf8" },
} satisfies ChartConfig
// --- Data ---
const areaData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const pieData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" },
]

// // --- Configs ---
// const standardConfig = {
//   desktop: { label: "Desktop", color: "#6366f1" }, // indigo-500
//   mobile: { label: "Mobile", color: "#818cf8" },   // indigo-400
// } satisfies ChartConfig

const pieConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "#4f46e5" },   // indigo-600
  safari: { label: "Safari", color: "#6366f1" },   // indigo-500
  firefox: { label: "Firefox", color: "#818cf8" }, // indigo-400
  edge: { label: "Edge", color: "#a5b4fc" },       // indigo-300
  other: { label: "Other", color: "#c7d2fe" },     // indigo-200
} satisfies ChartConfig

export function StoreCharts() {
  const totalVisitors = React.useMemo(() => pieData.reduce((acc, curr) => acc + curr.visitors, 0), [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Area Chart Gradient */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-900 font-extrabold tracking-tight">Revenue Trend</CardTitle>
          <CardDescription className="font-medium text-slate-500">Showing transaction volume for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={standardConfig} className="h-[250px] w-full">
            <AreaChart data={areaData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-xs font-bold text-slate-400"
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area dataKey="mobile" type="natural" fill="url(#fillMobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
              <Area dataKey="desktop" type="natural" fill="url(#fillDesktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter>
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="grid gap-1">
              <div className="flex items-center gap-2 leading-none font-bold text-emerald-600">
                Trending up by 12.5% this month <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 leading-none font-medium text-slate-400">
                January - June 2026
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Bar Chart Multiple */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-900 font-extrabold tracking-tight">Walk-in vs Online Orders</CardTitle>
          <CardDescription className="font-medium text-slate-500">January - June 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={standardConfig} className="h-[250px] w-full">
            <BarChart data={areaData}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-xs font-bold text-slate-400"
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 text-sm">
          <div className="flex gap-2 leading-none font-bold text-emerald-600">
            Online orders up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none font-medium text-slate-400">
            Showing total orders for the last 6 months
          </div>
        </CardFooter>
      </Card>

      {/* Line Chart */}
      <Card className="shadow-sm border-slate-100">
        <CardHeader>
          <CardTitle className="text-slate-900 font-extrabold tracking-tight">Daily Footfall</CardTitle>
          <CardDescription className="font-medium text-slate-500">Last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={standardConfig} className="h-[250px] w-full">
            <LineChart data={areaData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 3)}
                className="text-xs font-bold text-slate-400"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-desktop)" }} activeDot={{ r: 6 }} />
              <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Donut Text */}
      <Card className="shadow-sm border-slate-100 flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-slate-900 font-extrabold tracking-tight">Payment Methods</CardTitle>
          <CardDescription className="font-medium text-slate-500">All time distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px] w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={pieData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5} stroke="#fff">
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-3xl font-extrabold">{totalVisitors.toLocaleString()}</tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-slate-500 font-bold text-xs uppercase tracking-widest">Transactions</tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-1 text-sm mt-4">
          <div className="flex items-center gap-2 leading-none font-bold text-slate-700">
            Card payments dominate at 65%
          </div>
          <div className="leading-none font-medium text-slate-400">
            Based on historical data
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}
