import React from 'react';
import { Box, AlertTriangle, XCircle } from 'lucide-react';
import MetricCard from '@/components/global-components/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';

interface StockStats {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
}

interface Props {
    stats: StockStats;
    loading: boolean;
}

const StockOverviewCards: React.FC<Props> = ({ stats, loading }) => {
    const cards = [
        {
            label: 'In Stock',
            value: stats.totalItems,
            icon: Box,
            colorClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
        },
        {
            label: 'Low Stock',
            value: stats.lowStockItems,
            icon: AlertTriangle,
            colorClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
        },
        {
            label: 'Out of Stock',
            value: stats.outOfStockItems,
            icon: XCircle,
            colorClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-[110px] flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-2 w-20" />
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
                <MetricCard
                    key={idx}
                    title={card.label}
                    value={card.value}
                    icon={card.icon}
                    colorClass={card.colorClass}
                />
            ))}
        </div>
    );
};

export default StockOverviewCards;
