import React from 'react';
import { TrendingUp, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import MetricCard from '@/components/global-components/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SalesSummaryCardsProps {
    data: {
        totalAmount: number;
        completedCount: number;
        failedCount: number;
        refundedCount?: number;
        avgTicket?: number;
    };
    loading: boolean;
}

const SalesSummaryCards: React.FC<SalesSummaryCardsProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                {[1, 2, 3, 4].map((i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            <MetricCard
                title="Revenue"
                value={formatCurrency(data.totalAmount)}
                icon={TrendingUp}
                colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
            />
            <MetricCard
                title="Avg Ticket"
                value={formatCurrency(data.avgTicket || 0)}
                icon={CreditCard}
                colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
            />
            <MetricCard
                title="Transactions"
                value={data.completedCount}
                icon={CheckCircle2}
                colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            />
            <MetricCard
                title="Refunds"
                value={data.refundedCount || 0}
                icon={XCircle}
                colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
            />
        </div>
    );
};

export default SalesSummaryCards;
