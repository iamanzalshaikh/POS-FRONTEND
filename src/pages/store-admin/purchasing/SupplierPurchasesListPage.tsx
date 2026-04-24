import React, { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
    ClipboardList,
    History as HistoryIcon,
    Search,
    Truck,
    Wallet,
    AlertCircle,
    RefreshCw,
    Plus
} from "lucide-react";
import { 
    getSupplierPurchases, 
    getSuppliers, 
    type SupplierPurchase 
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { formatCurrencyShort, formatAmountShort } from "@/utils/format";
import MetricCard from '@/components/global-components/MetricCard';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks';

function num(v: string | number | undefined): number {
    if (v === undefined || v === null) return 0;
    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export default function SupplierPurchasesListPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = false;
    const base = usePurchasingBasePath();
    const [searchParams] = useSearchParams();
    const filterSupplierId = searchParams.get("supplierId") || "";

    const [supplierFilter, setSupplierFilter] = useState(filterSupplierId);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    useEffect(() => {
        setSupplierFilter(filterSupplierId);
    }, [filterSupplierId]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, supplierFilter]);

    const { data: purchasesRes, isLoading: loading, refetch: loadPurchases } = useQuery({
        queryKey: ['supplier-purchases', supplierFilter, debouncedSearch, page, limit],
        queryFn: () => getSupplierPurchases({
            limit,
            page,
            ...(supplierFilter ? { supplierId: supplierFilter } : {}),
            ...(debouncedSearch ? { search: debouncedSearch } : {})
        }),
        placeholderData: (previousData) => previousData,
        staleTime: 1000 * 60 * 5,
    });

    const { data: suppliersRes } = useQuery({
        queryKey: ['suppliers-active'], 
        queryFn: () => getSuppliers(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    const suppliers = useMemo(() => {
        const d = suppliersRes?.data?.data;
        if (Array.isArray(d)) return d.map((s) => ({ id: s.id, name: s.name }));
        return [];
    }, [suppliersRes]);

    const rows = useMemo(() => {
        return purchasesRes?.data?.data?.items || [];
    }, [purchasesRes]);

    const total = purchasesRes?.data?.data?.total ?? 0;
    const pageCount = Math.ceil(total / limit) || 1;

    const metrics = useMemo(() => {
        // Since we only have the current page's rows, we ideally need a summary endpoint
        // But for now we calculate based on what we have or zero out if uncertain
        const totalAmount = rows.reduce((acc: number, r: SupplierPurchase) => acc + num(r.totalAmount), 0);
        const totalBalance = rows.reduce((acc: number, r: SupplierPurchase) => acc + num(r.balance), 0);
        return {
            totalAmount,
            totalBalance
        };
    }, [rows, purchasesRes]);

    const columns: ColumnDef<SupplierPurchase>[] = useMemo(() => [
        {
            id: "purchaseNo",
            header: "ID",
            cell: ({ row }) => (
                <div className="flex justify-center uppercase tracking-widest text-[11px] font-black text-slate-400">
                    {String(row.index + 1).padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Supplier / Vendor",
            cell: ({ row }) => (
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                    {row.original.supplier?.name || "Unknown"}
                </p>
            )
        },
        {
            header: "Bought Qty",
            cell: ({ row }) => (
                <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight text-center">
                    {row.original.boughtQty || 0}
                </div>
            )
        },
        {
            header: "Total Amount",
            accessorKey: "totalAmount",
            cell: ({ row }) => (
                <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight text-center">
                    {formatAmountShort(num(row.original.totalAmount))}
                </div>
            )
        },
        {
            header: "Return Qty",
            cell: ({ row }) => (
                <div className={cn(
                    "font-black text-sm tracking-tight text-center",
                    (row.original.returnQty || 0) > 0 ? "text-rose-500" : "text-slate-300"
                )}>
                    {row.original.returnQty || '—'}
                </div>
            )
        },
        {
            header: "Return Amount",
            cell: ({ row }) => (
                <div className={cn(
                    "font-black text-sm tracking-tight text-center",
                    (row.original.returnAmount || 0) > 0 ? "text-rose-500" : "text-slate-300"
                )}>
                    {row.original.returnAmount ? formatAmountShort(num(row.original.returnAmount)) : '—'}
                </div>
            )
        },
        {
            header: "Net Balance",
            accessorKey: "balance",
            cell: ({ row }) => {
                const bal = num(row.original.balance);
                return (
                    <div className={cn(
                        "font-black text-sm tracking-tight text-center",
                        bal > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                        {bal !== 0 ? formatAmountShort(bal) : '—'}
                    </div>
                );
            }
        },
        {
            id: "purchaseDate",
            header: "Date & Time",
            accessorKey: "purchaseDate",
            cell: ({ row }) => (
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                        {new Date(row.original.purchaseDate).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                        {new Date(row.original.purchaseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center items-center">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="h-9 w-9 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95 shadow-none border-none group/action"
                        title="View Purchase Details"
                    >
                        <Link to={`${base}/purchases/${row.original.id}`}>
                            <HistoryIcon size={16} className="group-hover/action:scale-110 transition-transform" />
                        </Link>
                    </Button>
                </div>
            )
        }
    ], [base]);

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Purchase Inventory</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Receipts and procurement ledger</p>
                </div>
                {!readOnly && (
                    <div className="flex items-center gap-4">
                        <Button
                            asChild
                            variant="outline"
                            className="h-14 px-8 border-indigo-100 dark:border-indigo-900/50 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-none"
                        >
                            <Link to="/store-admin/purchasing/opening-stock">
                                <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                                Record Opening Stock
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="h-14 px-8 bg-[#1E1B4B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all active:scale-95 shadow-xl shadow-indigo-950/20 flex items-center gap-2"
                        >
                            <Link to="/store-admin/purchasing/purchases/new">
                                <Plus className="w-4 h-4" />
                                New Purchase Manifest
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <MetricCard 
                    title="Total Receipts" 
                    value={total} 
                    icon={ClipboardList} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Procured Value" 
                    value={metrics.totalAmount} 
                    isCurrency={true}
                    icon={Wallet} 
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                />
                <MetricCard 
                    title="Pending Balances" 
                    value={metrics.totalBalance} 
                    isCurrency={true}
                    icon={AlertCircle} 
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                <DataTable 
                    columns={columns} 
                    data={rows}
                    isLoading={loading}
                    onRefresh={loadPurchases}
                    manualPagination={true}
                    pageCount={pageCount}
                    pageIndex={page}
                    onPageChange={setPage}
                    totalItems={total}
                    pageSize={limit}
                    placeholder="Search purchases..."
                    exportFilename="Supplier-Purchases"
                    headerActions={
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Identify vendor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={supplierFilter}
                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                    className="pl-11 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[200px] h-10"
                                >
                                    <option value="">All Suppliers</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}

