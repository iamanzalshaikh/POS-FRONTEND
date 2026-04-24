import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Truck,
    Calendar,
    User,
    Package,
    CreditCard,
    Clock,
    Receipt,
    HistoryIcon,
    AlertCircle
} from "lucide-react";
import {
    getSupplierPurchase,
    createSupplierPayment,
    type SupplierPurchase,
    type SupplierPurchasePayment
} from "@/api/suppliers.api";
import { fetchPendingReturns, type SupplierPendingReturn } from "@/api/supplierPendingReturns.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { formatCurrencyShort, formatAmountShort, formatNumberShort } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import MetricCard from "@/components/global-components/MetricCard";

function num(v: string | number | undefined): number {
    if (v === undefined || v === null) return 0;
    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export default function SupplierPurchaseDetailPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = false;
    const base = usePurchasingBasePath();
    const { id } = useParams<{ id: string }>();
    const [purchase, setPurchase] = useState<SupplierPurchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [payMethod, setPayMethod] = useState<"CASH" | "BANK" | "CHEQUE">("CASH");
    const [payNotes, setPayNotes] = useState("");
    const [paySaving, setPaySaving] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const [resolvedReturns, setResolvedReturns] = useState<SupplierPendingReturn[]>([]);
    const [loadingReturns, setLoadingReturns] = useState(false);

    const loadPurchase = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getSupplierPurchase(id);
            setPurchase(res.data?.data || null);
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || "Failed to load purchase");
            setPurchase(null);
        } finally {
            setLoading(false);
        }
    };

    const loadReturns = async (supplierId: string) => {
        setLoadingReturns(true);
        try {
            const res = await fetchPendingReturns({ supplierId, status: 'RESOLVED' });
            setResolvedReturns(res.data || []);
        } catch (e) {
            console.error("Failed to load returns:", e);
        } finally {
            setLoadingReturns(false);
        }
    };

    useEffect(() => {
        if (purchase?.supplierId) {
            loadReturns(purchase.supplierId);
        }
    }, [purchase?.supplierId]);

    useEffect(() => {
        loadPurchase();
    }, [id]);

    const balance = purchase ? num(purchase.balance) : 0;

    const submitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !purchase) return;
        const amt = parseFloat(payAmount);
        if (Number.isNaN(amt) || amt <= 0) {
            setPayError("Enter a valid positive amount.");
            return;
        }
        if (amt > balance + 0.0001) {
            setPayError(`Amount cannot exceed balance (${formatCurrencyShort(balance)}).`);
            return;
        }
        setPaySaving(true);
        setPayError(null);
        try {
            await createSupplierPayment({
                purchaseId: id,
                amount: amt,
                paymentDate: new Date(payDate + "T12:00:00").toISOString(),
                method: payMethod,
                notes: payNotes.trim() || undefined,
            });
            toast.success(`Payment recorded successfully.`, "Settlement Updated");
            setPayAmount("");
            setPayNotes("");
            await loadPurchase();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Payment failed";
            setPayError(msg);
            toast.error(msg, "Payment Failed");
        } finally {
            setPaySaving(false);
        }
    };

    if (loading) {
        return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Retrieving stock receipt...</div>;
    }

    if (error || !purchase) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" asChild className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Link to={`${base}/purchases`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <ArrowLeft size={16} />
                        Purchase History
                    </Link>
                </Button>
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-black uppercase tracking-widest text-[10px]">
                    {error || "Receipt reference not found."}
                </div>
            </div>
        );
    }

    const payments = (purchase.payments || []) as SupplierPurchasePayment[];

    return (
        <div className="animate-fade-in space-y-10 max-w-[1600px] pb-10 mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 rounded-lg hover:bg-slate-100 text-slate-400">
                            <Link to={`${base}/purchases`}>
                                <ArrowLeft size={14} />
                            </Link>
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory / Purchase Details</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-3">
                        {purchase.supplier?.name || "Stock Receipt"}
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black self-center">
                            ID: {purchase.id.slice(-6).toUpperCase()}
                        </span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-3">
                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {new Date(purchase.purchaseDate).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> {purchase.user?.name || "System"}</div>
                        <div className="flex items-center gap-1.5"><Package size={12} className="text-emerald-500" /> {(purchase.items || []).length} Items</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 text-[10px] font-black uppercase tracking-widest h-11 px-6 transition-all"
                        onClick={() => window.print()}
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                <MetricCard
                    title="Invoice Total"
                    value={num(purchase.totalAmount)}
                    isCurrency={true}
                    icon={Receipt}
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard
                    title="Settled Amount"
                    value={num(purchase.paidAmount)}
                    isCurrency={true}
                    icon={CreditCard}
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard
                    title="Remaining Debt"
                    value={balance}
                    isCurrency={true}
                    icon={Clock}
                    colorClass={balance > 0 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-2 2xl:col-span-3 space-y-8">
                    {/* Items Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2 mb-8">
                            <Package size={14} className="text-blue-500" /> Stock Received
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                        <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Batch</th>
                                        <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Cost</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {(purchase.items || []).map((it) => (
                                        <tr key={it.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{it.product?.name || "—"}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-0.5">{it.product?.sku || "NO-SKU"}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono">
                                                #{it.batch?.batchNumber || it.id.slice(0, 6).toUpperCase()}
                                            </td>
                                            <td className="py-5 text-center text-sm font-black text-slate-900 dark:text-white">{formatNumberShort(it.quantity)}</td>
                                            <td className="py-5 text-right text-[11px] font-black text-slate-500 dark:text-slate-400">{formatAmountShort(num(it.unitPrice))}</td>
                                            <td className="py-5 text-right text-sm font-black text-slate-900 dark:text-white">{formatAmountShort(num(it.totalPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Transaction Ledger */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2 mb-8">
                            <HistoryIcon size={14} className="text-indigo-500" /> Transaction Ledger
                        </h3>
                        {payments.length === 0 ? (
                            <div className="py-12 text-center text-[10px] font-black uppercase tracking-[2px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No follow-up payments recorded
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                            <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</th>
                                            <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {payments.map((p) => (
                                            <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {new Date(p.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="py-5 text-center">
                                                    <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                        {p.method}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-[10px] font-bold text-slate-400 italic">
                                                    {p.notes || "Standard transaction"}
                                                </td>
                                                <td className="py-5 text-right text-sm font-black text-emerald-600">
                                                    +{formatAmountShort(num(p.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Return History Ledger */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2 mb-8">
                            <HistoryIcon size={14} className="text-rose-500" /> Return History Ledger
                        </h3>
                        {loadingReturns ? (
                             <div className="py-12 text-center text-[10px] font-black uppercase tracking-[2px] text-slate-400 animate-pulse">
                                Analyzing return history...
                             </div>
                        ) : resolvedReturns.length === 0 ? (
                            <div className="py-12 text-center text-[10px] font-black uppercase tracking-[2px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                No resolved returns found for this supplier
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                                            <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Resolution</th>
                                            <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {resolvedReturns.map((r) => (
                                            <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-5 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">{r.product.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">QTY: {r.quantity}</span>
                                                    </div>
                                                </td>
                                                <td className="py-5 text-center">
                                                    <span className={cn(
                                                        "inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                        r.resolutionType === 'STOCK_ADJUST_IN' 
                                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                                            : "bg-blue-50 text-blue-600 border border-blue-100"
                                                    )}>
                                                        {r.resolutionType === 'STOCK_ADJUST_IN' ? 'Stock In' : 'Ledger Credit'}
                                                    </span>
                                                </td>
                                                <td className="py-5 text-right text-sm font-black text-rose-500">
                                                    -₨ {Number(r.totalAmount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info & Payment Form */}
                <div className="space-y-8 sticky top-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800/50 space-y-8">
                        {/* Supplier Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-blue-500 border border-slate-100 dark:border-slate-800">
                                <Truck size={20} />
                            </div>
                            <div className="space-y-0.5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Account</h4>
                                <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">{purchase.supplier?.name}</p>
                            </div>
                        </div>

                        {purchase.notes && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Audit Memo</h4>
                                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl text-[11px] font-bold text-slate-500 italic border border-slate-100 dark:border-slate-800/50 shadow-sm leading-relaxed">
                                    "{purchase.notes}"
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance Status</h4>
                            <div className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl border",
                                balance > 0
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full", balance > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                                <span className="text-[10px] font-black uppercase tracking-[2px]">
                                    {balance > 0 ? 'Payment Pending' : 'Financials Cleared'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Settlement Portal */}
                    {balance > 0 && !readOnly && (
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 mb-8 flex items-center gap-2">
                                <CreditCard size={14} className="text-blue-500" /> Settlement Portal
                            </h3>
                            
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8 border border-slate-100 dark:border-slate-700/50 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Unpaid Balance</p>
                                <p className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{formatAmountShort(balance)}</p>
                            </div>

                            {payError && (
                                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                    <AlertCircle size={16} />
                                    {payError}
                                </div>
                            )}

                            <form onSubmit={submitPayment} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 px-1">Amount To Pay</label>
                                    <Input
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        max={balance}
                                        className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-lg rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 px-1">Settlement Date</label>
                                    <Input
                                        type="date"
                                        className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-xs rounded-xl"
                                        value={payDate}
                                        onChange={(e) => setPayDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 px-1">Payment Gateway</label>
                                    <div className="relative">
                                        <select
                                            className="h-12 w-full px-4 bg-slate-50 border border-slate-200 text-slate-900 font-black text-[10px] rounded-xl appearance-none cursor-pointer uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20"
                                            value={payMethod}
                                            onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                                        >
                                            <option value="CASH">Cash Handover</option>
                                            <option value="BANK">Bank Transfer</option>
                                            <option value="CHEQUE">Account Payee Cheque</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <CreditCard size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 px-1">Transaction Notes</label>
                                    <Input
                                        className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-[10px] placeholder:text-slate-400 rounded-xl uppercase tracking-widest"
                                        value={payNotes}
                                        onChange={(e) => setPayNotes(e.target.value)}
                                        placeholder="Reference #..."
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={paySaving}
                                    className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black uppercase tracking-[2px] text-[10px] mt-4 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    {paySaving ? "Processing..." : "Settle Balance"}
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}