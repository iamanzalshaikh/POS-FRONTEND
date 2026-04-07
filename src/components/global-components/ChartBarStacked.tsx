"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts";

import {
    type ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartBarStackedProps {
    data: any[];
    config: ChartConfig;
    title?: string;
    subtitle?: string;
    className?: string;
    height?: number | string;
}

const ChartBarStacked: React.FC<ChartBarStackedProps> = ({
    data,
    config,
    title,
    subtitle,
    className,
    height = 300,
}) => {
    // Extract keys from config for dynamic bars
    const keys = Object.keys(config);

    return (
        <div className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col transition-all hover:shadow-md ${className}`}>
            {(title || subtitle) && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {title && <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>}
                        {subtitle && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                    </div>
                </div>
            )}

            <div style={{ height }}>
                <ChartContainer config={config}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart accessibilityLayer data={data}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                axisLine={false}
                                dataKey="month"
                                tickFormatter={(value) => value.slice(0, 3)}
                                tickLine={false}
                                tickMargin={10}
                                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
                            />
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <ChartLegend content={<ChartLegendContent />} />

                            {keys.map((key, index) => {
                                const isLast = index === keys.length - 1;
                                const isFirst = index === 0;

                                // Rounded corners for the stack: bottom bar rounded at bottom, top bar rounded at top
                                const radius: [number, number, number, number] = isFirst
                                    ? [0, 0, 4, 4]
                                    : isLast
                                        ? [4, 4, 0, 0]
                                        : [0, 0, 0, 0];

                                return (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        fill={`var(--color-${key})`}
                                        radius={radius}
                                        stackId="a"
                                    />
                                );
                            })}
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );
};

export default ChartBarStacked;
