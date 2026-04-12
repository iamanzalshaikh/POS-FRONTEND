import React from 'react';
import { 
    Eye, 
    RefreshCcw, 
    MoreHorizontal, 
    CreditCard, 
    Smartphone, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    RotateCcw, 
    XCircle 
} from 'lucide-react';
import { getSaleGrandTotal, getSaleTaxTotal } from '@/utils/saleAmounts';

interface SalesHistoryTableProps {
    transactions: any[];
    loading: boolean;
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({
    transactions,
    loading,
    page,
    total,
    limit,
    onPageChange
}) => {
    const totalPages = Math.ceil(total / limit);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <CheckCircle2 size={12} />
                        Completed
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <AlertCircle size={12} />
                        Failed
                    </span>
                );
            case 'REFUNDED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <RotateCcw size={12} />
                        Refunded
                    </span>
                );
            case 'CANCELLED':
                return (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <XCircle size={12} />
                        Cancelled
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date / Time</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Items</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Device / Staff</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-[3px] border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] animate-pulse">Scanning Archive...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <button className="text-blue-600 font-extrabold text-sm hover:underline tracking-tight">
                                            {tx.invoiceNumber}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">
                                                {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(tx.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600">
                                            {tx._count?.saleItems || tx.itemsCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 tabular-nums">
                                                ₹{' '}
                                                {getSaleGrandTotal(tx).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                            {getSaleTaxTotal(tx) > 0 && (
                                                <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                                                    GST ₹{' '}
                                                    {getSaleTaxTotal(tx).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <CreditCard size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{tx.paymentMethod}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        {getStatusBadge(tx.paymentStatus)}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                                <Smartphone size={12} className="text-slate-400" />
                                                {tx.device?.deviceName || 'Terminal-01'}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                                {tx.user?.name || 'Store Admin'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-2.5 text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 rounded-xl transition-all border border-transparent hover:border-[#2563EB]/10" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                            {tx.paymentStatus === 'FAILED' && (
                                                <button className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Retry">
                                                    <RefreshCcw size={18} />
                                                </button>
                                            )}
                                            <button className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300 mx-auto">
                                            <Clock size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Archive Empty</h4>
                                            <p className="text-xs text-slate-400 font-bold max-w-xs mx-auto uppercase tracking-widest leading-loose mt-2">No verified sales matched your active filter criteria.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Showing <span className="text-slate-900 font-extrabold">{Math.max(0, (page-1)*limit + 1)}</span> to <span className="text-slate-900 font-extrabold">{Math.min(page*limit, total)}</span> of <span className="text-slate-900 font-extrabold">{total}</span> entries
                </span>
                
                {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1 || loading}
                            className="p-2.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 hover:border-[#2563EB]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                        </button>

                        <span className="min-w-[40px] h-10 flex items-center justify-center bg-[#1E1B4B] text-white text-[10px] font-black rounded-xl shadow-md shadow-[#1E1B4B]/20 border border-[#1E1B4B]/20 px-3">
                            {page}
                        </span>

                        <button 
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages || loading}
                            className="p-2.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 hover:border-[#2563EB]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
                            aria-label="Next page"
                        >
                            <ChevronRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesHistoryTable;
