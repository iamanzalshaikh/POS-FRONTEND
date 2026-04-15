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
    PlusCircle,
    Receipt, HistoryIcon
} from "lucide-react";
import {
    getSupplierPurchase,
    createSupplierPayment,
    type SupplierPurchase,
    type SupplierPurchasePayment
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { formatCurrencyShort, formatNumberShort } from "@/utils/format";
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
    const readOnly = userAuth?.role === "ACCOUNTANT";
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
            toast.success(`Payment of ${formatCurrencyShort(amt)} recorded successfully.`, "Settlement Updated");
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
        <div className="animate-fade-in space-y-10 max-w-6xl pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 rounded-lg hover:bg-slate-100 text-slate-400">
                            <Link to={`${base}/purchases`}>
                                <ArrowLeft size={14} />
                            </Link>
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory / Purchase Details</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        {purchase.supplier?.name || "Stock Receipt"}
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                            ID: {purchase.id.slice(-6).toUpperCase()}
                        </span>
                    </h1>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-500" /> {new Date(purchase.purchaseDate).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> {purchase.user?.name || "System"}</div>
                        <div className="flex items-center gap-1.5"><Package size={12} className="text-emerald-500" /> {(purchase.items || []).length} Line Items</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-950/30 text-[10px] font-black uppercase tracking-widest h-11 px-6 shadow-sm active:scale-95 transition-all"
                        onClick={() => window.print()}
                    >
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Details & Items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Items Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
                                <Package size={14} className="text-blue-500" /> Stock Batches Received
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product Line</th>
                                        <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Ref</th>
                                        <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Cost</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {(purchase.items || []).map((it) => (
                                        <tr key={it.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                            <td className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{it.product?.name || "—"}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-0.5">{it.product?.sku || "NO-SKU"}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                                                #{it.batch?.batchNumber || it.id.slice(0, 6).toUpperCase()}
                                            </td>
                                            <td className="py-4 text-center text-sm font-black text-slate-900 dark:text-white">{formatNumberShort(it.quantity)}</td>
                                            <td className="py-4 text-right text-[11px] font-black text-slate-500 dark:text-slate-400">{formatCurrencyShort(num(it.unitPrice))}</td>
                                            <td className="py-4 text-right text-sm font-black text-slate-900 dark:text-white">{formatCurrencyShort(num(it.totalPrice))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
                                <HistoryIcon size={14} className="text-indigo-500" /> Transaction Ledger
                            </h3>
                        </div>
                        {payments.length === 0 ? (
                            <div className="py-6 text-center text-[10px] font-black uppercase tracking-[2px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl">
                                No follow-up payments recorded
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                            <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Method</th>
                                            <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 space-x-2">Notes</th>
                                            <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {payments.map((p) => (
                                            <tr key={p.id} className="group">
                                                <td className="py-4 text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                    {new Date(p.paymentDate).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest shadow-sm">
                                                        {p.method}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-[10px] font-bold text-slate-400 italic">
                                                    {p.notes || "Standard transaction"}
                                                </td>
                                                <td className="py-4 text-right text-sm font-black text-emerald-600">
                                                    +{formatCurrencyShort(num(p.amount))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Meta Information Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-400">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supplier Account</h4>
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{purchase.supplier?.name}</p>
                            </div>
                        </div>

                        {purchase.notes && (
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internal Audit Memo</h4>
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-[11px] font-bold text-slate-500 italic border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                    "{purchase.notes}"
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Compliance Status</h4>
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-xl border",
                                balance > 0
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            )}>
                                <div className={cn("w-2 h-2 rounded-full animate-pulse", balance > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                                <span className="text-[10px] font-black uppercase tracking-[2px]">
                                    {balance > 0 ? 'Payment Pending' : 'Financials Cleared'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Record Payment Section */}
                    {balance > 0 && !readOnly && (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50 shadow-sm relative">
                            <div className="relative z-10">
                                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 mb-6 flex items-center gap-2">
                                    <CreditCard size={14} className="text-blue-500" /> Settlement Portal
                                </h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6 border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Unpaid Balance</p>
                                    <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{formatCurrencyShort(balance)}</p>
                                </div>

                                {payError && (
                                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <AlertCircle size={16} />
                                        {payError}
                                    </div>
                                )}

                                <form onSubmit={submitPayment} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1 text-left block">Amount To Pay</label>
                                        <Input
                                            type="number"
                                            min={0.01}
                                            step="0.01"
                                            max={balance}
                                            className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-lg placeholder:text-slate-400 rounded-xl"
                                            value={payAmount}
                                            onChange={(e) => setPayAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1 text-left block">Settlement Date</label>
                                        <Input
                                            type="date"
                                            className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-sm rounded-xl"
                                            value={payDate}
                                            onChange={(e) => setPayDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1 text-left block">Payment Gateway</label>
                                        <select
                                            className="h-12 w-full px-4 bg-slate-50 border border-slate-200 text-slate-900 font-black text-xs rounded-xl appearance-none cursor-pointer"
                                            value={payMethod}
                                            onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                                        >
                                            <option value="CASH" className="uppercase tracking-widest font-black">Cash Handover</option>
                                            <option value="BANK" className="uppercase tracking-widest font-black">Bank Transfer</option>
                                            <option value="CHEQUE" className="uppercase tracking-widest font-black">Account Payee Cheque</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1 text-left block">Transaction Notes</label>
                                        <Input
                                            className="h-12 bg-slate-50 border-slate-200 text-slate-900 font-black text-xs placeholder:text-slate-400 rounded-xl"
                                            value={payNotes}
                                            onChange={(e) => setPayNotes(e.target.value)}
                                            placeholder="Reference #, Bank Details..."
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={paySaving}
                                        className="w-full h-14 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black uppercase tracking-[2px] text-[10px] mt-4"
                                    >
                                        {paySaving ? "Validating..." : "Settle Balance"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
