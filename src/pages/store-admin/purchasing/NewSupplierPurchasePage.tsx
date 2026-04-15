import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, 
    Truck, 
    Calendar, 
    FileText, 
    Plus,
    ShoppingCart,
    Wallet,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { getSuppliers, createSupplierPurchase } from "@/api/suppliers.api";
import { fetchProducts } from "@/api/products.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
type ProductRow = {
    key: string;
    productId: string;
    name: string;
    category: string;
    sku: string;
    barcode: string;
    unitType: string;
    qtyPerUnit: string;
    quantity: string;
    purchaseCost: string;
    sellingPrice: string;
    gstPercentage: string;
    lineDiscount: string;
    initialStock: string;
    alertAt: string;
};

export default function NewSupplierPurchasePage() {
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);
    const base = usePurchasingBasePath();
    
    const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<ProductRow[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void getSuppliers().then((r) => {
            const d = r.data?.data;
            if (Array.isArray(d)) setSuppliers(d.filter((s) => s.isActive).map((s) => ({ id: s.id, name: s.name })));
        });
        void fetchProducts({ isActive: true }).then((body: any) => {
            const raw = body?.data || (Array.isArray(body) ? body : []);
            setProducts(raw);
        });
    }, []);
    const addSelectedProduct = () => {
        if (!selectedProductId) return;
        const p = products.find((prod) => prod.id === selectedProductId);
        if (!p) return;
        if (items.some((it) => it.productId === p.id)) return;
        setItems((prev) => [
            ...prev,
            {
                key: `${Date.now()}`,
                productId: p.id,
                name: p.name || "",
                category: p.category?.name || "",
                sku: p.sku || "",
                barcode: p.barcode || "",
                unitType: p.unitType || "PIECE",
                qtyPerUnit: p.unitQuantity ? String(p.unitQuantity) : "",
                quantity: "1",
                purchaseCost: p.purchasePrice ? String(p.purchasePrice) : "0",
                sellingPrice: p.sellingPrice ? String(p.sellingPrice) : "0",
                gstPercentage: "18",
                lineDiscount: "0",
                initialStock: "1",
                alertAt: String(p.reorderLevel ?? 10),
            },
        ]);
        setSelectedProductId("");
    };

    const updateLine = (key: string, patch: Partial<ProductRow>) => {
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
                purchaseCost: parseFloat(l.purchaseCost),
                sellingPrice: parseFloat(l.sellingPrice),
                gstPercentage: parseFloat(l.gstPercentage),
                lineDiscount: parseFloat(l.lineDiscount),
                initialStock: parseInt(l.initialStock, 10),
                alertAt: parseInt(l.alertAt, 10),
            }));
        
        for (const it of apiItems) {
            if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
                setError("Negative or fractional quantity detected in product lines.");
                return;
            }
            if (Number.isNaN(it.purchaseCost) || it.purchaseCost < 0) {
                setError("Invalid cost basis detected in product lines.");
                return;
            }
        }
        
        if (apiItems.length === 0) {
            setError("Empty manifest: Add at least one valid product line.");
            return;
        }
        
        setSaving(true);
        try {
            const res = await createSupplierPurchase({
                supplierId,
                purchaseDate: new Date(purchaseDate + "T12:00:00").toISOString(),
                items: apiItems,
                paidAmount: 0,
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
        <div className="animate-fade-in space-y-10 max-w-[96rem] w-full pb-10">
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-3">
                            <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2">
                                <ShoppingCart size={14} className="text-indigo-500" /> Product Selection
                            </h3>
                            <div className="flex gap-2 w-full md:w-auto">
                                <select
                                    className="h-10 w-full min-w-[260px] px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">Select Product...</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                                <Button type="button" onClick={addSelectedProduct} className="h-10 px-4 rounded-xl">
                                    <Plus size={14} /> Add
                                </Button>
                            </div>
                        </div>

                        <div className="min-h-[200px]">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[22%]">Product</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[9%]">Unit</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[8%]">Qty/Unit</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[7%]">Qty</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Buy</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Sell</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[7%]">GST</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[8%]">Disc</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Initial</th>
                                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[9%]">Alert</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {items.map((line) => (
                                        <tr key={line.key}>
                                            <td className="py-3 pr-2">
                                                <p className="text-xs font-black text-slate-900 truncate">{line.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{line.category} • {line.sku}</p>
                                            </td>
                                            <td className="py-3 pr-2 text-xs">{line.unitType}</td>
                                            <td className="py-3 px-1"><Input className="h-9 w-full" value={line.qtyPerUnit} onChange={(e) => updateLine(line.key, { qtyPerUnit: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.quantity} onChange={(e) => updateLine(line.key, { quantity: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.purchaseCost} onChange={(e) => updateLine(line.key, { purchaseCost: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.sellingPrice} onChange={(e) => updateLine(line.key, { sellingPrice: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.gstPercentage} onChange={(e) => updateLine(line.key, { gstPercentage: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.lineDiscount} onChange={(e) => updateLine(line.key, { lineDiscount: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.initialStock} onChange={(e) => updateLine(line.key, { initialStock: e.target.value })} /></td>
                                            <td className="py-3 px-1"><Input type="number" className="h-9 w-full" value={line.alertAt} onChange={(e) => updateLine(line.key, { alertAt: e.target.value })} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 mb-4 flex items-center gap-2">
                            <Wallet size={14} /> Submit Purchase
                        </h3>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-xl shadow-blue-500/20"
                        >
                            {saving ? "Committing..." : "Commit & Receive Stock"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
