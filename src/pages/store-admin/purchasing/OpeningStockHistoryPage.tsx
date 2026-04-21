import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
    History,
    Search,
    Plus,
    Wallet,
    AlertCircle,
    Calendar,
    ArrowRight
} from "lucide-react";
import { 
    getSupplierPurchases, 
    type SupplierPurchase 
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { formatAmountShort } from "@/utils/format";
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

export default function OpeningStockHistoryPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = false;
    const base = usePurchasingBasePath();

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    const { data: purchasesRes, isLoading: loading, refetch: loadPurchases } = useQuery({
        queryKey: ['opening-stock-history', debouncedSearch, page, limit],
        queryFn: () => getSupplierPurchases({
            limit,
            page,
            isOpeningStock: true, // Specifically filter for Opening Stock
        }),
        staleTime: 1000 * 60 * 5,
    });

    const rows = useMemo(() => {
        return purchasesRes?.data?.data?.items || [];
    }, [purchasesRes]);

    const total = purchasesRes?.data?.data?.total ?? 0;
    const pageCount = Math.ceil(total / limit) || 1;

    const stats = useMemo(() => {
        // Calculate based on loaded entries (usually few for opening stock)
        const totalVal = rows.reduce((acc, r) => acc + num(r.totalAmount), 0);
        const totalBal = rows.reduce((acc, r) => acc + num(r.balance), 0);
        return { totalVal, totalBal };
    }, [rows]);

    const columns: ColumnDef<SupplierPurchase>[] = useMemo(() => [
        {
            id: "batchId",
            header: "Sl No",
            cell: ({ row }) => (
                <div className="flex justify-center text-[11px] font-black text-slate-400">
                    {String(row.index + 1).padStart(2, '0')}
                </div>
            )
        },
        {
            header: "Inventory Batch / Entry",
            cell: ({ row }) => (
                <div>
                     <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {row.original.notes || `O.S. Batch ${row.original.id.slice(-6)}`}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> {new Date(row.original.purchaseDate).toLocaleDateString()}
                    </p>
                </div>
            )
        },
        {
            header: "Stock Valuation",
            accessorKey: "totalAmount",
            meta: { align: 'right' },
            cell: ({ row }) => (
                <div className="font-bold text-sm text-slate-900 dark:text-white text-right">
                    ₨ {num(row.original.totalAmount).toLocaleString()}
                </div>
            )
        },
        {
            header: "Remaining Balance",
            accessorKey: "balance",
            meta: { align: 'right' },
            cell: ({ row }) => {
                const bal = num(row.original.balance);
                return (
                    <div className={cn(
                        "font-black text-sm text-right",
                        bal > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                        ₨ {bal.toLocaleString()}
                    </div>
                );
            }
        },
        {
            header: "Payment Status",
            cell: ({ row }) => {
                const bal = num(row.original.balance);
                const isPaid = bal <= 0;
                return (
                    <div className="flex justify-center">
                        <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border",
                            isPaid 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                                : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50"
                        )}>
                            {isPaid ? 'Fully Settle' : 'Pending Settle'}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="h-9 px-4 hover:bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-widest text-[9px]"
                    >
                        <Link to={`${base}/purchases/${row.original.id}`}>
                            View Items <ArrowRight size={14} className="ml-2" />
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                        Opening Stock Records
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        History of initial inventory investments & liabilities
                    </p>
                </div>
                {!readOnly && (
                    <Button
                        asChild
                        className="h-14 px-8 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200/20 flex items-center gap-2"
                    >
                        <Link to="/store-admin/purchasing/opening-stock/new">
                            <Plus size={16} />
                            Record New Opening Stock
                        </Link>
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard 
                    title="Total Investment" 
                    value={stats.totalVal} 
                    isCurrency={true}
                    icon={History} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Total Outstanding Liability" 
                    value={stats.totalBal} 
                    isCurrency={true}
                    icon={Wallet} 
                    colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6">
                <DataTable 
                    columns={columns} 
                    data={rows}
                    isLoading={loading}
                    onRefresh={loadPurchases}
                    manualPagination={true}
                    pageCount={pageCount}
                    pageIndex={page}
                    onPageChange={setPage}
                    placeholder="Search records..."
                    headerActions={
                        <div className="flex items-center gap-3">
                             <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Reference check..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-[240px]"
                                />
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
