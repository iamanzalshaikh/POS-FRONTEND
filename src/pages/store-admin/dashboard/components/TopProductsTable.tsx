import { useMemo } from 'react';
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from '@/components/global-components/data-table-2';
import { formatCurrency, formatCurrencyShort, formatNumberShort } from '@/utils/format';
import { RefreshCw } from 'lucide-react';
import type { Product } from '../types';

interface TopProductsTableProps {
    products: Product[];
    onRefresh?: () => void;
    isLoading?: boolean;
}

export default function TopProductsTable({ products, onRefresh, isLoading = false }: TopProductsTableProps) {
    const columns: ColumnDef<Product>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: "Product Details",
            meta: { align: 'left' },
            cell: ({ row }) => {
                const product = row.original;
                return (
                    <div className="flex items-center py-1 min-w-[180px]">
                        <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate uppercase tracking-tight">{product.name}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "sku",
            header: "SKU",
            meta: { align: 'center' },
            cell: ({ row }) => <span className="font-mono text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.getValue("sku")}</span>
        },
        {
            accessorKey: "revenue",
            header: "Revenue",
            meta: { align: 'right' },
            cell: ({ row }) => (
                <div className="text-right">
                    <span className="font-black text-slate-900 dark:text-white text-[13px] tabular-nums tracking-tight">
                        {formatCurrencyShort(row.getValue("revenue"))}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "stockLevel",
            header: "Stock Health",
            meta: { align: 'center' },
            cell: ({ row }) => {
                const stock = Number(row.getValue("stockLevel"));
                const isCritical = stock < 30;
                return (
                    <div className="min-w-[140px] space-y-1.5 px-2">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[2px]">
                            <span className={isCritical ? 'text-rose-500' : 'text-emerald-500'}>
                                {isCritical ? 'Critical' : 'Healthy'}
                            </span>
                            <span className="text-slate-900 dark:text-white tabular-nums">{stock}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${stock}%` }}
                            ></div>
                        </div>
                    </div>
                );
            }
        }
    ], []);

    const topProducts = products.slice(0, 5);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-none p-6 pt-8 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Top Selling Inventory</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1.5">Highest grossing items this window</p>
                </div>
            </div>

            <DataTable 
                columns={columns} 
                data={topProducts} 
                hidePagination={false}
                manualPagination={false}
                showColumnVisibility={false}
                onRefresh={onRefresh}
                isLoading={isLoading}
                exportFilename="Top-Selling-Inventory"
            />
        </div>
    );
}
