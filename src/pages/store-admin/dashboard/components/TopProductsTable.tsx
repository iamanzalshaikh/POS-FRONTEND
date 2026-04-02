import { formatCurrency } from '@/utils/format';
import type { Product } from '../types';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

interface TopProductsTableProps {
    products: Product[];
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
    // Only show Top 3 sellers for the dashboard widget
    const topProducts = useMemo(() => products.slice(0, 3), [products]);

    const columns: ColumnDef<Product>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Product Details",
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] group-hover:border-[#2563EB]/20 transition-all">
                            <span className="font-black text-xs uppercase">{product.name.charAt(0)}</span>
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA] transition-colors">{product.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Category ID: 10{product.id}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "sku",
            header: "SKU",
            cell: ({ row }) => <span className="font-mono text-xs font-black text-slate-400 dark:text-slate-500">{row.getValue("sku")}</span>
        },
        {
            accessorKey: "revenue",
            header: "Revenue",
            cell: ({ row }) => (
                <div className="text-right font-black text-slate-900 dark:text-white text-sm tabular-nums">
                    {formatCurrency(row.getValue("revenue"))}
                </div>
            )
        },
        {
            accessorKey: "stockLevel",
            header: "Stock Health",
            cell: ({ row }) => {
                const stockLevel = row.original.stockLevel;
                const isCritical = stockLevel < 30;
                return (
                    <div className="space-y-1.5 min-w-[150px]">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className={isCritical ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}>{isCritical ? 'Critical' : 'Good'}</span>
                            <span className="text-slate-900 dark:text-white tabular-nums">{stockLevel}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : 'bg-[#262255] dark:bg-indigo-500'}`}
                                style={{ width: `${stockLevel}%` }}
                            />
                        </div>
                    </div>
                );
            }
        }
    ], []);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg dark:shadow-none transition-all duration-300">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Top Selling Inventory</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-bold uppercase tracking-widest mt-1">Most popular products this week</p>
                </div>
            </div>

            <div className="flex-1 p-2">
                <DataTable
                    columns={columns}
                    data={topProducts}
                    searchKey="name"
                    placeholder="Filter inventory..."
                />
            </div>
        </div>
    );
}
