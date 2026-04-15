// Hooks & Routing
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

// Icons
import {
  ArrowLeft,
  Truck,
  Calendar,
  User,
  Package,
  CreditCard,
  Clock,
  PlusCircle,
  Receipt,
  HistoryIcon,
  MapPin,
  Phone,
  AlertCircle
} from "lucide-react";

// API
import {
  getSupplierPurchase,
  createSupplierPayment,
  type SupplierPurchase,
  type SupplierPurchasePayment
} from "@/api/suppliers.api";

// Components & Utils
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MetricCard from "@/components/global-components/MetricCard";
import { formatCurrencyShort, formatNumberShort } from "@/utils/format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

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
    return (
      <div className="flex items-center justify-center p-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">
        Retrieving stock receipt...
      </div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          asChild 
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Link 
            to={`${base}/purchases`} 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500"
          >
            <ArrowLeft size={16} />
            Purchase History
          </Link>
        </Button>

        <div className="p-6 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 font-black uppercase tracking-widest text-[10px]">
          {error || "Receipt reference not found."}
        </div>
      </div>
    );
  }

  const payments = (purchase.payments || []) as SupplierPurchasePayment[];

  return (
    <div className="animate-fade-in space-y-10 max-w-6xl pb-10 w-full">
      {/* Header Area */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800/50 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/20 rounded-full translate-x-1/2 -translate-y-1/2 opacity-50 -z-0" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
          <div className="space-y-6 max-w-xl text-left">
            {purchase.store?.logoUrl ? (
              <img
                src={purchase.store.logoUrl}
                alt="Store Logo"
                className="h-16 w-auto object-contain rounded-xl shadow-sm"
              />
            ) : (
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white text-2xl font-black shadow-lg">
                {purchase.store?.name?.charAt(0) || "S"}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                  {purchase.store?.name || "Global Retail Store"}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mt-1 italic">
                  Authorized Procurement Receipt
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    {purchase.store?.address || "Street Address Not Provided"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-indigo-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-500">
                    {purchase.store?.phone || "Phone N/A"}
                  </span>
                </div>

                {purchase.store?.taxNtn && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NTN:</span>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">
                      {purchase.store.taxNtn}
                    </span>
                  </div>
                )}

                {purchase.store?.taxStrn && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STRN:</span>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">
                      {purchase.store.taxStrn}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end justify-between min-w-[200px] text-left md:text-right">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 dark:shadow-none">
                Receipt # {purchase.id.slice(-8).toUpperCase()}
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] pt-1">
                Issued: {new Date(purchase.purchaseDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
              </div>
              <div className="flex items-center md:justify-end gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                <User size={12} /> Prepared by: {purchase.user?.name || "System"}
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Procured From</p>
              <div className="group flex items-center md:justify-end gap-2 cursor-pointer">
                <Truck size={18} className="text-blue-500 transition-transform group-hover:-translate-x-1" />
                <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                  {purchase.supplier?.name}
                </span>
              </div>
              {purchase.supplier?.phone && (
                <p className="text-[10px] font-bold text-slate-500 tracking-widest">
                  {purchase.supplier.phone}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Items</span>
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase tabular-nums">
                {(purchase.items || []).length} Lines
              </span>
            </div>
            <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                num(purchase.balance) > 0 
                  ? "bg-amber-100 text-amber-600" 
                  : "bg-emerald-100 text-emerald-600"
              )}>
                {num(purchase.balance) > 0 ? "Outstanding" : "Settled"}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => window.print()}
            className="h-10 px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all"
          >
            Export Document
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
          colorClass={
            balance > 0 
              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" 
              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
          }
        />
      </div>

      {/* Details & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Items Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
                <Package size={14} className="text-blue-500" /> 
                Stock Batches Received
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800/50">
                    <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product Line</th>
                    <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Batch Ref</th>
                    <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Unit</th>
                    <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                    <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Unit Cost</th>
                    <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {(purchase.items || []).map((it) => (
                    <tr key={it.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {it.product?.name || "—"}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[2px] mt-0.5">
                            {it.product?.sku || "NO-SKU"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                        #{it.batch?.batchNumber || it.id.slice(0, 6).toUpperCase()}
                      </td>

                      <td className="py-4 text-center">
                        <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {it.product?.unitType || "PCS"}
                        </span>
                      </td>

                      <td className="py-4 text-center text-sm font-black text-slate-900 dark:text-white">
                        {formatNumberShort(it.quantity)}
                      </td>

                      <td className="py-4 text-right text-[11px] font-black text-slate-500 dark:text-slate-400">
                        {formatCurrencyShort(num(it.unitPrice))}
                      </td>

                      <td className="py-4 text-right text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrencyShort(num(it.totalPrice))}
                      </td>
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
                <HistoryIcon size={14} className="text-indigo-500" /> 
                Transaction Ledger
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
                      <tr key={p.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
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
          <div className="space-y-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-slate-400">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Supplier Account
                </h4>
                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {purchase.supplier?.name}
                </p>
              </div>
            </div>

            {purchase.notes && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Internal Audit Memo
                </h4>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-[11px] font-bold text-slate-500 italic border border-slate-100 dark:border-slate-800/50 shadow-sm">
                  "{purchase.notes}"
                </div>
              </div>
            )}

            <div className="pt-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Compliance Status
              </h4>
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-xl border",
                balance > 0
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
              )}>
                <div 
                  className={cn(
                    "w-2 h-2 rounded-full animate-pulse", 
                    balance > 0 ? "bg-amber-500" : "bg-emerald-500"
                  )} 
                />
                <span className="text-[10px] font-black uppercase tracking-[2px]">
                  {balance > 0 ? 'Payment Pending' : 'Financials Cleared'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Horizontal Settlement Portal at the Bottom */}
      {balance > 0 && !readOnly && (
        <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-10 border border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-8 xl:gap-12">
            {/* Balance Info */}
            <div className="flex items-center gap-6 w-full xl:w-auto shrink-0 border-b xl:border-b-0 xl:border-r border-slate-800 pb-6 xl:pb-0 xl:pr-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/10 text-indigo-400 shrink-0">
                <CreditCard size={32} />
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-slate-500 mb-1.5">
                  Unpaid Balance
                </h3>
                <p className="text-4xl font-black tabular-nums tracking-tight text-white">
                  {formatCurrencyShort(balance)}
                </p>
              </div>
            </div>

            {/* Horizontal Form */}
            <form 
              onSubmit={submitPayment} 
              className="flex-1 w-full"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-end">
                <div className="space-y-2.5">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1">
                    Amount To Pay
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    max={balance}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-14 bg-slate-800/50 border-slate-700 text-white font-black text-base placeholder:text-slate-600 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1">
                    Settlement Date
                  </label>
                  <Input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="h-14 bg-slate-800/50 border-slate-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                    className="h-14 w-full px-4 bg-slate-800/50 border border-slate-700 text-white font-black text-[10px] uppercase tracking-[2px] rounded-2xl appearance-none cursor-pointer outline-none focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque Issue</option>
                  </select>
                </div>

                <div className="space-y-2.5 lg:col-span-2 xl:col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-[2px] text-slate-500 pl-1">
                    Audit Notes
                  </label>
                  <Input
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Reference #, memo..."
                    className="h-14 bg-slate-800/50 border-slate-700 text-white font-black text-[11px] placeholder:text-slate-600 rounded-2xl focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
                  <Button
                    type="submit"
                    disabled={paySaving}
                    className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-black uppercase tracking-[3px] text-[10px] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all"
                  >
                    {paySaving ? "Securing Transaction..." : "Complete Settlement"}
                  </Button>
                </div>
              </div>

              {payError && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-[3px] rounded-xl">
                  <AlertCircle size={16} />
                  {payError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}