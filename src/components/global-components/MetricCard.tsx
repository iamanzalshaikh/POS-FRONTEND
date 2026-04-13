import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: any;
    change?: number | string;
    isPositive?: boolean;
    /** Small line under the main value (e.g. data source) */
    subtitle?: string;
    colorClass?: string;
    className?: string;
    /**
     * `stacked`: icon top-right, title/value bottom — equal heights in grids.
     * `horizontal`: original side-by-side layout (default).
     */
    variant?: 'horizontal' | 'stacked';
    /** Smaller padding, type, and icon — only applies with `variant="stacked"`. */
    compact?: boolean;
}

const changeBadge = (
    change: number | string | undefined,
    isPositive: boolean,
    compact?: boolean
) => {
    if (change === undefined) return null;
    return (
        <div
            className={cn(
                'inline-flex shrink-0 items-center gap-0.5 rounded-md font-black uppercase tracking-wider',
                compact ? 'px-1 py-0.5 text-[8px]' : 'px-1.5 py-0.5 text-[9px]',
                isPositive
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
            )}
        >
            {isPositive ? '+' : '-'}
            {Math.abs(Number(change))}%
            {isPositive ? (
                <ArrowUpRight size={compact ? 9 : 10} strokeWidth={3} />
            ) : (
                <ArrowDownRight size={compact ? 9 : 10} strokeWidth={3} />
            )}
        </div>
    );
};

const MetricCard = ({
    title,
    value,
    icon: Icon,
    change,
    isPositive = true,
    subtitle,
    colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    className,
    variant = 'horizontal',
    compact = false,
}: MetricCardProps) => {
    const titleClass = cn(
        'font-black text-slate-400 dark:text-slate-500 uppercase leading-tight',
        compact ? 'text-[9px] tracking-[0.14em]' : 'text-[10px] tracking-[0.18em]'
    );

    if (variant === 'stacked') {
        return (
            <div
                className={cn(
                    'group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900',
                    compact
                        ? 'min-h-[118px] p-3 sm:min-h-[124px] sm:p-3.5 rounded-xl'
                        : 'min-h-[158px] p-5 sm:min-h-[168px] sm:p-6',
                    'hover:shadow-md hover:shadow-indigo-500/5 dark:hover:shadow-indigo-950/20',
                    className
                )}
            >
                <div className="flex shrink-0 justify-end">
                    <div
                        className={cn(
                            'rounded-xl shadow-sm transition-transform group-hover:scale-105',
                            compact ? 'rounded-lg p-1.5 sm:p-2' : 'p-2.5 sm:p-3',
                            colorClass
                        )}
                    >
                        <Icon size={compact ? 18 : 24} strokeWidth={2.5} />
                    </div>
                </div>
                <div className={cn('mt-auto flex min-h-0 flex-col', compact ? 'gap-1 pt-2' : 'gap-1.5 pt-4')}>
                    <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', compact ? 'min-h-[18px]' : 'min-h-[22px]')}>
                        <p className={cn(titleClass, 'max-w-full')}>{title}</p>
                        {changeBadge(change, isPositive, compact)}
                    </div>
                    <h3
                        className={cn(
                            'font-black tabular-nums tracking-tight text-slate-900 dark:text-white',
                            compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
                        )}
                    >
                        {value}
                    </h3>
                    <div className={compact ? 'min-h-8' : 'min-h-10'}>
                        {subtitle ? (
                            <p
                                className={cn(
                                    'line-clamp-2 font-medium leading-snug tracking-normal text-slate-500 normal-case dark:text-slate-400',
                                    compact ? 'text-[9px]' : 'text-[10px]'
                                )}
                            >
                                {subtitle}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group relative flex min-h-[110px] flex-col justify-center overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900',
                'hover:shadow-xl hover:shadow-indigo-500/10',
                className
            )}
        >
            <div className="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-slate-50/50 transition-transform duration-500 group-hover:scale-125 dark:bg-slate-800/50" />

            <div className="relative z-10 flex w-full items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex min-h-[22px] flex-wrap items-center gap-2">
                        <p className={cn(titleClass, 'truncate')}>{title}</p>
                        {changeBadge(change, isPositive, false)}
                    </div>
                    <h3 className="truncate text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </h3>
                    {subtitle ? (
                        <p className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-snug tracking-normal text-slate-500 normal-case dark:text-slate-400">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                <div
                    className={cn(
                        'shrink-0 rounded-2xl p-3 shadow-sm transition-transform group-hover:scale-110',
                        colorClass
                    )}
                >
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
