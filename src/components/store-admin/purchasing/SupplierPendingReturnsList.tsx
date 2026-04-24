import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPendingReturns, resolvePendingReturn, type SupplierPendingReturn } from '@/api/supplierPendingReturns.api';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { 
    Clock, 
    RefreshCcw, 
    DollarSign, 
    CheckCircle2, 
    Loader2,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

const SupplierPendingReturnsList = ({ supplierId }: { supplierId?: string }) => {
    const queryClient = useQueryClient();
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'PENDING' | 'RESOLVED'>('PENDING');

    const { data: returnsRes, isLoading, refetch } = useQuery({
        queryKey: ['supplier-pending-returns', supplierId || 'all', viewMode],
        queryFn: () => fetchPendingReturns({ supplierId, status: viewMode }),
    });

    const pendingReturns = (returnsRes?.data || []) as SupplierPendingReturn[];

    const resolveMutation = useMutation({
        mutationFn: ({ id, resolutionType }: { id: string, resolutionType: 'STOCK_ADJUST_IN' | 'CREDIT_AMOUNT' }) => 
            resolvePendingReturn(id, { resolutionType }),
        onSuccess: (data, variables) => {
            const action = variables.resolutionType === 'STOCK_ADJUST_IN' ? 'returned to stock' : 'credited to ledger';
            toast.success(`Success`, `Return successfully ${action}`);
            queryClient.invalidateQueries({ queryKey: ['supplier-pending-returns'] });
            queryClient.invalidateQueries({ queryKey: ['supplier-purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setResolvingId(null);
        },
        onError: (error: any) => {
            toast.error('Error', error.response?.data?.message || 'Failed to resolve return');
            setResolvingId(null);
        }
    });

    const columns = useMemo<ColumnDef<SupplierPendingReturn>[]>(() => [
        {
            id: 'product',
            accessorFn: row => row.product.name,
            header: 'Product',
            meta: { align: 'left', className: 'min-w-[200px]' },
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Package size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{item.product.name}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SKU: {item.product.sku}</span>
                        </div>
                    </div>
                );
            }
        },
        ...(!supplierId ? [{
            accessorKey: 'supplier.name',
            header: 'Supplier',
            meta: { align: 'left' },
            cell: ({ row }: { row: any }) => (
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                    {row.original.supplier.name}
                </span>
            )
        }] : []),
        {
            accessorKey: 'quantity',
            header: 'Qty',
            meta: { align: 'center' },
            cell: ({ row }) => (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-900 dark:text-white">
                    {row.original.quantity}
                </span>
            )
        },
        {
            accessorKey: 'totalAmount',
            header: 'Value',
            meta: { align: 'right' },
            cell: ({ row }) => (
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                        ₨ {Number(row.original.totalAmount).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                        ₨ {Number(row.original.purchasePrice).toLocaleString()} / unit
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: viewMode === 'PENDING' ? 'Date' : 'Resolution',
            meta: { align: 'center' },
            cell: ({ row }) => {
                const item = row.original;
                if (viewMode === 'PENDING') {
                    return (
                        <div className="flex flex-col items-center gap-1">
                            <Clock size={12} className="text-amber-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                            item.resolutionType === 'STOCK_ADJUST_IN' 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-blue-50 text-blue-600 border-blue-100"
                        )}>
                            {item.resolutionType === 'STOCK_ADJUST_IN' ? 'Stock In' : 'Ledger Credit'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400">
                            {item.resolvedAt && new Date(item.resolvedAt).toLocaleDateString()}
                        </span>
                    </div>
                );
            }
        },
        {
            id: 'actions',
            header: 'Actions',
            meta: { align: 'right' },
            cell: ({ row }) => {
                const item = row.original;
                if (viewMode === 'RESOLVED') {
                    return (
                        <div className="flex items-center justify-end text-emerald-500 pr-2">
                            <CheckCircle2 size={16} />
                        </div>
                    );
                }
                return (
                    <div className="flex items-center justify-end gap-2 pr-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={resolvingId === item.id}
                            onClick={() => {
                                setResolvingId(item.id);
                                resolveMutation.mutate({ id: item.id, resolutionType: 'STOCK_ADJUST_IN' });
                            }}
                            className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100/50 gap-2 transition-all active:scale-95 group/btn"
                        >
                            {resolvingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <RefreshCcw size={14} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                            )}
                            <span className="text-[9px] font-black uppercase tracking-widest">Stock In</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={resolvingId === item.id}
                            onClick={() => {
                                setResolvingId(item.id);
                                resolveMutation.mutate({ id: item.id, resolutionType: 'CREDIT_AMOUNT' });
                            }}
                            className="h-9 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/50 gap-2 transition-all active:scale-95 group/btn"
                        >
                            {resolvingId === item.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <DollarSign size={14} className="group-hover/btn:scale-110 transition-transform" />
                            )}
                            <span className="text-[9px] font-black uppercase tracking-widest">Credit</span>
                        </Button>
                    </div>
                );
            }
        }
    ], [viewMode, supplierId, resolvingId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-100 dark:border-slate-800/50 ml-4">
                <button
                    onClick={() => setViewMode('PENDING')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        viewMode === 'PENDING' 
                            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    Pending
                </button>
                <button
                    onClick={() => setViewMode('RESOLVED')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        viewMode === 'RESOLVED' 
                            ? "bg-white dark:bg-slate-900 text-rose-600 shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    Resolved History
                </button>
            </div>

            <DataTable 
                columns={columns}
                data={pendingReturns}
                isLoading={isLoading}
                searchKey="product"
                placeholder="Search by product name..."
                onRefresh={refetch}
                exportFilename={`Returns-${viewMode}`}
            />
        </div>
    );
};

export default SupplierPendingReturnsList;
