import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
    ClipboardList,
    History as HistoryIcon,
    Search,
    Truck,
    Wallet,
    AlertCircle
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
import { Skeleton } from '@/components/ui/skeleton';

function num(v: string | number | undefined): number {
    if (v === undefined || v === null) return 0;
    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export default function SupplierPurchasesListPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = userAuth?.role === "ACCOUNTANT";
    const base = usePurchasingBasePath();
    const [searchParams] = useSearchParams();
    const filterSupplierId = searchParams.get("supplierId") || "";

    const [rows, setRows] = useState<SupplierPurchase[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [supplierFilter, setSupplierFilter] = useState(filterSupplierId);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setSupplierFilter(filterSupplierId);
    }, [filterSupplierId]);

    const loadPurchases = async () => {
        setLoading(true);
        try {
            const res = await getSupplierPurchases({
                limit: 100,
                page: 1,
                ...(supplierFilter ? { supplierId: supplierFilter } : {}),
            });
            const payload = res.data?.data;
            setRows(payload?.items || []);
            setTotal(payload?.total ?? 0);
        } catch (e: any) {
            console.error("Failed to load purchases:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases();
    }, [supplierFilter]);

    useEffect(() => {
        void getSuppliers().then((r) => {
            const d = r.data?.data;
            if (Array.isArray(d)) setSuppliers(d.map((s) => ({ id: s.id, name: s.name })));
        });
    }, []);

    const metrics = useMemo(() => {
        const totalAmount = rows.reduce((acc, r) => acc + num(r.totalAmount), 0);
        const totalBalance = rows.reduce((acc, r) => acc + num(r.balance), 0);
        return {
            totalAmount,
            totalBalance
        };
    }, [rows]);

    const columns: ColumnDef<SupplierPurchase>[] = [
        {
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
            header: "Total Amount",
            accessorKey: "totalAmount",
            cell: ({ row }) => (
                <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                    {formatAmountShort(num(row.original.totalAmount))}
                </div>
            )
        },
        {
            header: "Paid Status",
            cell: ({ row }) => {
                const bal = num(row.original.balance);
                const isPaid = bal <= 0;
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border",
                            isPaid 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                                : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50"
                        )}>
                            {isPaid ? 'Fully Paid' : 'Partially Paid'}
                        </span>
                        {!isPaid && (
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                                {formatAmountShort(num(row.original.paidAmount))} paid
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            header: "Remaining Balance",
            accessorKey: "balance",
            cell: ({ row }) => {
                const bal = num(row.original.balance);
                return (
                    <div className={cn(
                        "font-black text-sm tracking-tight text-center",
                        bal > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                        {bal > 0 ? formatAmountShort(bal) : '—'}
                    </div>
                );
            }
        },
        {
            header: "Purchase Date",
            accessorKey: "purchaseDate",
            cell: ({ row }) => (
                <div className="flex flex-col">
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
    ];

    const filteredRows = rows.filter(r => {
        const qArr = searchQuery.toLowerCase().split(' ');
        const supplierName = (r.supplier?.name || '').toLowerCase();
        return qArr.every(q => supplierName.includes(q));
    });

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Purchase Inventory</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Receipts and procurement ledger</p>
                </div>
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

            {loading ? (
                <div className="space-y-10 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <Skeleton className="h-10 w-64 rounded-xl" />
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-32 rounded-xl" />
                                <Skeleton className="h-10 w-32 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                    <DataTable 
                        columns={columns} 
                        data={filteredRows}
                        isLoading={loading}
                        onRefresh={loadPurchases}
                        placeholder="Search purchases..."
                        hidePagination={false}
                        manualPagination={false}
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
            )}
        </div>
    );
}
