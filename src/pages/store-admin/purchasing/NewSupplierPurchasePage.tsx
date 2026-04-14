import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, 
    Truck, 
    Calendar, 
    FileText, 
    Plus, 
    Trash2, 
    ShoppingCart,
    Wallet,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { getSuppliers, createSupplierPurchase } from "@/api/suppliers.api";
import { fetchProducts } from "@/api/products.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { formatCurrencyShort } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Line = { key: string; productId: string; quantity: string; unitPrice: string };

export default function NewSupplierPurchasePage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const base = usePurchasingBasePath();
    
    const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
    const [supplierId, setSupplierId] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [paidAmount, setPaidAmount] = useState("0");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<Line[]>([
        { key: "1", productId: "", quantity: "1", unitPrice: "" },
    ]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void getSuppliers().then((r) => {
            const d = r.data?.data;
            if (Array.isArray(d)) setSuppliers(d.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name })));
        });
        void fetchProducts({ isActive: true }).then((body: any) => {
            const raw = body?.data || (Array.isArray(body) ? body : []);
            setProducts(
                raw.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku || "",
                }))
            );
        });
    }, []);

    const { lineTotals, grandTotal, paidNum, balance } = useMemo(() => {
        let sum = 0;
        const lt = items.map((l) => {
            const q = parseInt(l.quantity, 10);
            const u = parseFloat(l.unitPrice);
            const t = Number.isFinite(q) && Number.isFinite(u) && q > 0 && u >= 0 ? q * u : 0;
            sum += t;
            return t;
        });
        const paid = parseFloat(paidAmount);
        const p = Number.isFinite(paid) && paid >= 0 ? paid : 0;
        return {
            lineTotals: lt,
            grandTotal: sum,
            paidNum: p,
            balance: sum - p,
        };
    }, [items, paidAmount]);

    const addLine = () => {
        setItems((prev) => [...prev, { key: `${Date.now()}`, productId: "", quantity: "1", unitPrice: "" }]);
    };

    const removeLine = (key: string) => {
        setItems((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
    };

    const updateLine = (key: string, patch: Partial<Line>) => {
        setItems((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!supplierId) {
            setError("Identification required: Select a vendor to proceed.");
            return;
        }
        const apiItems = items
            .filter((l) => l.productId)
            .map((l) => ({
                productId: l.productId,
                quantity: parseInt(l.quantity, 10),
                unitPrice: parseFloat(l.unitPrice),
            }));
        
        for (const it of apiItems) {
            if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
                setError("Negative or fractional quantity detected in product lines.");
                return;
            }
            if (Number.isNaN(it.unitPrice) || it.unitPrice < 0) {
                setError("Invalid cost basis detected in product lines.");
                return;
            }
        }
        
        if (apiItems.length === 0) {
            setError("Empty manifest: Add at least one valid product line.");
            return;
        }
        
        if (paidNum > grandTotal + 0.0001) {
            setError("Financial discrepancy: Paid amount cannot exceed total invoice value.");
            return;
        }

        setSaving(true);
        try {
            const res = await createSupplierPurchase({
                supplierId,
                purchaseDate: new Date(purchaseDate + "T12:00:00").toISOString(),
                items: apiItems,
                paidAmount: paidNum,
                notes: notes.trim() || undefined,
            });
            toast.success("Purchase manifest committed and stock received successfully.", "Ledger Updated");
            const id = res.data?.data?.id;
            if (id) navigate(`${base}/purchases/${id}`);
            else navigate(`${base}/purchases`);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Ledger commit error: Check connection.";
            setError(msg);
            toast.error(msg, "Commit Failed");
        } finally {
            setSaving(false);
        }
    };

    if (user?.role === "ACCOUNTANT") {
        return <Navigate to={`${base}/purchases`} replace />;
    }

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
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inventory / New Purchase</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Log New Receipt</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Receive stock and reconcile vendor balances</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Information Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2 mb-8">
                            <Truck size={14} className="text-blue-500" />
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400">Ledger Identification</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Vendor / Supplier <span className="text-rose-500">*</span></label>
                                <div className="relative flex items-center">
                                    <Truck className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <select
                                        required
                                        className="h-12 w-full pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                                        value={supplierId}
                                        onChange={(e) => setSupplierId(e.target.value)}
                                    >
                                        <option value="">Select Vendor...</option>
                                        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div className="absolute right-4 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Receipt Date <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <Input
                                        type="date"
                                        required
                                        className="h-12 pl-11 bg-slate-50 placeholder:text-slate-400 border-slate-100 rounded-xl font-bold text-sm"
                                        value={purchaseDate}
                                        onChange={(e) => setPurchaseDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Internal Reference / Notes</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <Input 
                                    className="h-12 pl-11 bg-slate-50 border-slate-100 rounded-xl font-bold text-sm" 
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)} 
                                    placeholder="Enter batch notes or invoice reference..." 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
                                <ShoppingCart size={14} className="text-indigo-500" /> Inventory manifest
                            </h3>
                            <Button 
                                type="button" 
                                variant="secondary" 
                                size="sm" 
                                onClick={addLine} 
                                className="h-10 px-4 rounded-xl text-blue-600 bg-blue-50 hover:bg-blue-100 font-black uppercase tracking-widest text-[9px] gap-2 active:scale-95 transition-all border border-blue-100"
                            >
                                <Plus size={14} /> Add row
                            </Button>
                        </div>
                        
                        <div className="overflow-x-auto min-h-[200px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product Identifer</th>
                                        <th className="pb-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Price</th>
                                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                                        <th className="pb-4" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((line, idx) => (
                                        <tr key={line.key}>
                                            <td className="py-4 pr-4">
                                                <div className="relative">
                                                    <select
                                                        className="h-11 w-full min-w-[240px] px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase tracking-tighter outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer"
                                                        value={line.productId}
                                                        onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                                                    >
                                                        <option value="">Identify Product...</option>
                                                        {products.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.sku})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    className="w-20 h-11 text-center font-black bg-slate-50 border-slate-100 rounded-xl"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className="w-28 h-11 text-right font-black bg-slate-50 border-slate-100 rounded-xl"
                                                    value={line.unitPrice}
                                                    onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="py-4 pl-4 text-right">
                                                <span className="text-sm font-black text-slate-900 tracking-tight">
                                                    {formatCurrencyShort(lineTotals[idx] || 0)}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-4 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLine(line.key)}
                                                    disabled={items.length <= 1}
                                                    className="h-9 w-9 p-0 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Financial Reconciliation Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 text-slate-900 dark:text-white">
                           <Wallet size={160} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 dark:text-slate-500 mb-8 flex items-center gap-2">
                                <Wallet size={14} /> Settlement Control
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Invoice Total</span>
                                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{formatCurrencyShort(grandTotal)}</span>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Amount Paid Now</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        className="h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-black text-xl placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all rounded-2xl"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className={cn(
                                    "p-6 rounded-2xl flex justify-between items-center transition-all",
                                    balance > 0 ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20" : "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20"
                                )}>
                                    <div>
                                        <p className={cn("text-[9px] font-black uppercase tracking-widest", balance > 0 ? "text-amber-500" : "text-emerald-500")}>Outstanding Balance</p>
                                        <p className={cn("text-xl font-black tracking-tight", balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{formatCurrencyShort(balance)}</p>
                                    </div>
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", balance > 0 ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500")}>
                                        {balance > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                                    </div>
                                </div>

                                <Button 
                                    type="submit" 
                                    disabled={saving} 
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] mt-6 shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <span className="animate-pulse text-[10px]">Committing Ledger...</span>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            <span>Commit & Receive Stock</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
