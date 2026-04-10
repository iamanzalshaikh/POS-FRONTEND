import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: any;
    colorClass?: string;
    className?: string;
}

const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    colorClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400", 
    className 
}: MetricCardProps) => (
    <div className={cn(
        "bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden relative flex flex-col justify-center h-full min-h-[110px]",
        className
    )}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50/50 dark:bg-slate-800/50 rounded-full -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500"></div>
        
        <div className="flex items-center justify-between relative z-10 w-full gap-4">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1.5 truncate">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate tabular-nums">{value}</h3>
            </div>
            <div className={cn("p-3 rounded-2xl transition-all shrink-0 group-hover:scale-110 shadow-sm", colorClass)}>
                <Icon size={24} strokeWidth={2.5} />
            </div>
        </div>
    </div>
);

export default MetricCard;
