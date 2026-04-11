import { History } from 'lucide-react';

const StockAdjustmentTable = ({ adjustments = [] }: { adjustments?: any[] }) => {
    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                <History className="text-blue-500" size={20} />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Adjustments</h3>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 dark:bg-slate-800 border-y border-slate-100 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 w-12 text-center">ID</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Product Name</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">SKU</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Quantity</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Notes</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Operator</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {adjustments.length > 0 ? (
                            adjustments.map((adj, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-3 text-center">
                                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600 transition-colors">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {adj.product?.name || 'Deleted Product'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px]">
                                            {adj.product?.sku || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${
                                            adj.changeType === 'DAMAGE' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30' :
                                            adj.changeType === 'RETURN' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30' :
                                            adj.changeType === 'PURCHASE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {adj.changeType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-center tabular-nums">
                                        <span className={`text-xs font-black ${
                                            adj.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[200px]" title={adj.notes}>
                                            {adj.notes || '—'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
                                            {new Date(adj.createdAt).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        {adj.user?.name || 'System'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                    No recent adjustments found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockAdjustmentTable;
