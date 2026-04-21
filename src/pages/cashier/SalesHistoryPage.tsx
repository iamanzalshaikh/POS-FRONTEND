import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, Eye, Download, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { getSalesTransactions } from '@/api/sales.api';
import { formatCurrency, toLocalYMD, formatInvoiceNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/global-components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../hooks/use-debounce';

const SalesHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    
    const [dateRange, setDateRange] = useState({
        start: toLocalYMD(new Date(new Date().setDate(new Date().getDate() - 7))), // Default to last 7 days
        end: toLocalYMD(new Date())
    });

    const [page, setPage] = useState(1);
    const [limit] = useState(25); // Reduced from 1000 to 25 for sub-500ms performance

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, dateRange]);

    const { data: salesRes, isLoading, refetch } = useQuery({
        queryKey: ['sales-history', debouncedSearch, dateRange, page, limit],
        queryFn: () => getSalesTransactions({
            startDate: dateRange.start,
            endDate: dateRange.end,
            page,
            limit,
            ...(debouncedSearch && { search: debouncedSearch })
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 30000,
    });

    const transactions = useMemo(() => salesRes?.data?.data || salesRes?.data || [], [salesRes]);
    const totalItems = salesRes?.data?.total || (Array.isArray(salesRes?.data) ? salesRes?.data.length : 0);
    const pageCount = salesRes?.data?.lastPage || Math.ceil(totalItems / limit) || 1;

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            header: "Invoice",
            accessorKey: "invoiceNumber",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">#{formatInvoiceNumber(row.original.invoiceNumber || row.original.id)}</span>
                </div>
            )
        },
        {
            header: "Customer",
            accessorKey: "customerName",
            cell: ({ row }) => (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {row.original.customerName || 'Walk-in Customer'}
                </span>
            )
        },
        {
            header: "Amount",
            accessorKey: "totalAmount",
            meta: { align: 'right' },
            cell: ({ row }) => (
                <span className="text-xs font-black uppercase tracking-widest tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(row.original.totalAmount)}
                </span>
            )
        },
        {
            header: "Payment",
            accessorKey: "paymentMethod",
            cell: ({ row }) => (
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/50">
                    {row.original.paymentMethod}
                </span>
            )
        },
        {
            header: "Status",
            accessorKey: "paymentStatus",
            cell: ({ row }) => {
                const s = String(row.original.paymentStatus).toLowerCase();
                const isRef = row.original.isReversal || s === 'refunded';
                const isPartial = s === 'partially_refunded';
                return (
                    <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border leading-tight",
                        isRef ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
                        isPartial ? "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/50" :
                        s === 'completed' || s === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" :
                        s === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
                        "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                    )}>
                        {isRef ? 'refunded' : isPartial ? 'partial refund' : s}
                    </span>
                );
            }
        },
        {
            id: "saleDate", // Unique ID to fix key warnings
            header: "Date",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            )
        },
        {
            id: "saleTime", // Unique ID to fix key warnings
            header: "Time",
            accessorKey: "createdAt",
            cell: ({ row }) => (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => navigate(`/cashier/receipt/${row.original.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                        title="View Receipt"
                    >
                        <Eye size={16} />
                    </button>
                    <button 
                        onClick={() => navigate(`/cashier/receipt/${row.original.id}`, { state: { autoPrint: true } })}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/50"
                        title="Print Receipt"
                    >
                        <Printer size={16} />
                    </button>
                </div>
            )
        }
    ], [navigate]);

    return (
        <div className="animate-fade-in space-y-8">
            <PageHeader 
                title="Sale History"
                description="View and track all completed transactions"
                primaryAction={{
                    label: "Refresh Ledger",
                    icon: RefreshCw,
                    onClick: () => refetch()
                }}
            />

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
                <DataTable 
                    columns={columns} 
                    data={transactions}
                    isLoading={isLoading}
                    onRefresh={refetch}
                    manualPagination={true}
                    pageCount={pageCount}
                    pageIndex={page}
                    onPageChange={setPage}
                    totalItems={totalItems}
                    pageSize={limit}
                    placeholder="Search ledger..."
                    headerActions={
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search invoice..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
                                />
                                <span className="text-slate-300 dark:text-slate-700 font-bold">—</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
                                />
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default SalesHistoryPage;
