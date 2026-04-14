import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNumberShort, formatCurrencyShort } from '@/utils/format';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: any;
    change?: number | string;
    isPositive?: boolean;
    colorClass?: string;
    className?: string;
    isCurrency?: boolean;
}

const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change,
    isPositive = true,
    colorClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400", 
    className,
    isCurrency = false
}: MetricCardProps) => {
    const displayValue = typeof value === 'number' 
        ? (isCurrency ? formatCurrencyShort(value) : formatNumberShort(value))
        : value;

    return (
    <div className={cn(
        "bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden relative flex flex-col justify-center h-full min-h-[110px]",
        className
    )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50/50 dark:bg-slate-800/50 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500"></div>
        
        <div className="flex items-center justify-between relative z-10 w-full gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] truncate">{title}</p>
                    {change !== undefined && (
                        <div className={cn(
                            "flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                            isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                        )}>
                            {isPositive ? '+' : '-'}{Math.abs(Number(change))}%
                            {isPositive ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                        </div>
                    )}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate tabular-nums">{displayValue}</h3>
            </div>
            <div className={cn("p-3 rounded-2xl transition-all shrink-0 group-hover:scale-110 shadow-sm", colorClass)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    </div>
);
};

export default MetricCard;

