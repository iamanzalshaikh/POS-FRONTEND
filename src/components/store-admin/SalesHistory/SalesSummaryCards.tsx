import { TrendingUp, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

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
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {/* Period Total Sales */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-600/5 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50/50 dark:bg-slate-800/20 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100/50 dark:border-indigo-800/50">
                            <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-xl uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 shadow-sm">Revenue</span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-3">Gross Sales</p>
                        {loading ? (
                            <div className="h-9 w-32 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                        ) : (
                            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner w-fit">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                    {formatCurrency(data.totalAmount)}
                                </h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Average Ticket */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/50 dark:border-blue-800/50">
                            <CreditCard size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-800 shadow-sm">Average</span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-3">Avg Ticket Size</p>
                        {loading ? (
                            <div className="h-9 w-28 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                        ) : (
                            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner w-fit">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                    {formatCurrency(data.avgTicket || 0)}
                                </h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Completed Transactions */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100/50 dark:border-indigo-800/50">
                            <CheckCircle2 size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-xl uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 shadow-sm">Success</span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-3">Transactions</p>
                        {loading ? (
                            <div className="h-9 w-20 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                        ) : (
                            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-inner w-fit">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">
                                    {data.completedCount}
                                </h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Refunded / Alert */}
            <div className="bg-white dark:bg-slate-900 p-7 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm border border-rose-100/50 dark:border-rose-800/50">
                            <XCircle size={24} strokeWidth={2.5} />
                        </div>
                        <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2.5 py-1 rounded-xl uppercase tracking-widest border border-rose-100 dark:border-rose-800 shadow-sm">Refunds</span>
                    </div>
                    <div className="mt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-3">Total Refunds</p>
                        {loading ? (
                            <div className="h-9 w-20 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                        ) : (
                            <div className="px-5 py-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl shadow-inner w-fit">
                                <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter tabular-nums">
                                    {data.refundedCount || 0}
                                </h2>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesSummaryCards;
