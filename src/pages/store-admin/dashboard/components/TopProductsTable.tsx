import { MoreVertical, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { Product } from '../types';

interface TopProductsTableProps {
    products: Product[];
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
    // Only show Top 3 sellers
    const paginatedProducts = products.slice(0, 3);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg dark:shadow-none transition-all duration-300">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Top Selling Inventory</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-bold uppercase tracking-widest mt-1">Most popular products this week</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                        <input type="text" placeholder="Filter items..." className="pl-12 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/30 focus:ring-4 focus:ring-[#2563EB]/5 transition-all placeholder:text-slate-400 w-full sm:w-48 font-bold text-slate-900 dark:text-white" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">

                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                            <th className="px-8 py-5">Product Details</th>
                            <th className="px-8 py-5">SKU</th>
                            <th className="px-8 py-5 text-right">Revenue</th>
                            <th className="px-8 py-5">Stock Health</th>
                            <th className="px-4 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedProducts.map((product) => (
                            <tr key={product.id} className="group hover:bg-[#2563EB]/5 dark:hover:bg-[#2563EB]/10 transition-all cursor-pointer">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] group-hover:border-[#2563EB]/20 transition-all">
                                            <span className="font-black text-xs uppercase">{product.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">{product.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Category ID: 10{product.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 font-mono text-xs font-black text-slate-400 dark:text-slate-500">{product.sku}</td>
                                <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white text-sm tabular-nums">{formatCurrency(product.revenue)}</td>
                                <td className="px-8 py-5 min-w-[180px]">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className={product.stockLevel < 30 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}>{product.stockLevel < 30 ? 'Critical' : 'Good'}</span>
                                            <span className="text-slate-900 dark:text-white tabular-nums">{product.stockLevel}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${product.stockLevel < 30 ? 'bg-rose-500' : 'bg-[#262255] dark:bg-indigo-500'}`} style={{ width: `${product.stockLevel}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-right">
                                    <button className="p-2 text-slate-300 hover:text-[#2563EB] opacity-0 group-hover:opacity-100 transition-all">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
