import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: any;
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: any;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        icon?: any;
    };
    className?: string;
    children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    icon: Icon,
    primaryAction,
    secondaryAction,
    className,
    children
}) => {
    return (
        <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10", className)}>
            <div>
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{title}</h1>
                </div>
                {description && (
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 ml-1">
                        {description}
                    </p>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                {children}

                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                        {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                        {secondaryAction.label}
                    </button>
                )}
                
                {primaryAction && (
                    <button
                        onClick={primaryAction.onClick}
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-400/20 border border-blue-500"
                    >
                        {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
                        {primaryAction.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;
