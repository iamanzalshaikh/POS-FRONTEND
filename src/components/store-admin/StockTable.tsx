import React from 'react';
import { Box } from 'lucide-react';

interface InventoryItem {
    id: string;
    productName: string;
    sku: string;
    image?: string;
    currentStock: number;
    reorderLevel: number;
    category?: string;
}

interface Props {
    items: InventoryItem[];
    loading: boolean;
}

const StockTable: React.FC<Props> = ({ items, loading }) => {
    const getStatusBadge = (current: number, reorder: number) => {
        if (current === 0) {
            return (
                <span className="px-2.5 py-1 bg-rose-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight">
                    Out of Stock
                </span>
            );
        }
        if (current <= reorder) {
            return (
                <span className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight">
                    Low Stock
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-[2px] leading-tight">
                Healthy
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-24 text-center border border-slate-100 shadow-sm flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Stock Levels...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-white dark:bg-slate-900 border-t-4 border-black">
                        <tr className="border-b-4 border-black">
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 w-12">ID</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Product Details</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Category</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap text-right">Stock</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap text-right">Reorder Level</th>
                            <th className="px-6 py-5 text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <tr key={item.id} className="group border-b-2 border-black last:border-0 hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                                <td className="px-6 py-4 text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                                    {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 dark:border-slate-800 flex flex-shrink-0 items-center justify-center overflow-hidden shadow-sm group-hover:border-indigo-600/20 transition-all">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                    <Box size={20} strokeWidth={1.5} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">{item.productName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-0.5 truncate leading-none">SKU: {item.sku}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[2px]">{item.category || 'General'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-[11px] font-black uppercase tracking-widest tabular-nums ${item.currentStock <= item.reorderLevel ? 'text-rose-600' : 'text-slate-900'}`}>
                                        {item.currentStock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums leading-none">{item.reorderLevel}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {getStatusBadge(item.currentStock, item.reorderLevel)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockTable;
