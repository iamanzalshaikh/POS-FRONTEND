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
        "bg-white dark:bg-slate-900 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group overflow-hidden relative flex flex-col justify-center h-full min-h-[90px]",
        className
    )}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50/50 dark:bg-slate-800/50 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform"></div>
        
        <div className="flex items-center justify-between relative z-10 w-full gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-0.5 truncate">{title}</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{value}</h3>
            </div>
            <div className={cn("p-2.5 rounded-xl transition-all shrink-0 group-hover:scale-110 shadow-sm", colorClass)}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
        </div>
    </div>
);

export default MetricCard;
