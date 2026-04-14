import { History } from 'lucide-react';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

interface StockAdjustmentTableProps {
    adjustments: any[];
    totalItems: number;
    pageIndex: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

const StockAdjustmentTable = ({ 
    adjustments = [], 
    totalItems, 
    pageIndex, 
    pageSize, 
    onPageChange 
}: StockAdjustmentTableProps) => {

    const columns: ColumnDef<any>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                    {String(row.index + 1 + (pageIndex - 1) * pageSize).padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Product Name",
            accessorKey: "product.name",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {row.original.product?.name || 'Deleted Product'}
                </span>
            )
        },
        {
            header: "SKU",
            accessorKey: "product.sku",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px]">
                    {row.original.product?.sku || 'N/A'}
                </span>
            )
        },
        {
            header: "Type",
            accessorKey: "changeType",
            cell: ({ row }) => {
                const type = row.original.changeType;
                return (
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${
                        type === 'DAMAGE' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30' :
                        type === 'RETURN' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30' :
                        type === 'PURCHASE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                        {type}
                    </span>
                );
            }
        },
        {
            header: "Quantity",
            accessorKey: "quantityChange",
            cell: ({ row }) => {
                const qty = row.original.quantityChange;
                return (
                    <span className={`text-xs font-black tabular-nums ${
                        qty > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                        {qty > 0 ? '+' : ''}{qty}
                    </span>
                );
            }
        },
        {
            header: "Notes",
            accessorKey: "notes",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[200px]" title={row.original.notes}>
                    {row.original.notes || '—'}
                </p>
            )
        },
        {
            header: "Date",
            accessorKey: "createdAt",
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums leading-none">
                    {new Date(row.original.createdAt).toLocaleString()}
                </span>
            )
        },
        {
            header: "Operator",
            accessorKey: "user.name",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                    {row.original.user?.name || 'System'}
                </span>
            )
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden animate-fade-in p-6">
            <div className="flex items-center gap-3 mb-6">
                <History className="text-blue-500" size={20} />
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Recent Adjustments</h3>
            </div>
            
            <DataTable 
                columns={columns}
                data={adjustments}
                totalItems={totalItems}
                pageSize={pageSize}
                pageIndex={pageIndex}
                manualPagination={true}
                onPageChange={onPageChange}
                hidePagination={false}
            />
        </div>
    );
};

export default StockAdjustmentTable;
