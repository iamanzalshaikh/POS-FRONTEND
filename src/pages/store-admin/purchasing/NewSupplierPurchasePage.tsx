// Hooks & Routing
import { useState, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

// Icons
import {
  ArrowLeft,
  Truck,
  Calendar,
  FileText,
  Plus,
  ShoppingCart,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search
} from "lucide-react";

// API
import { getSuppliers, createSupplierPurchase } from "@/api/suppliers.api";
import { fetchProducts } from "@/api/products.api";

// Components & Utils
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
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
  alertAt: string;
};

export default function NewSupplierPurchasePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const base = usePurchasingBasePath();

  const [selectedProductId, setSelectedProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prodSearch, setProdSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Queries
  const { data: supsRes } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: () => getSuppliers(),
    staleTime: 1000 * 60 * 10,
  });

  const { data: prodsRes } = useQuery({
    queryKey: ['products-catalog-lite'],
    queryFn: () => fetchProducts({ isActive: true, limit: 1000 }),
    staleTime: 1000 * 60 * 10,
  });

  const suppliers = useMemo(() => {
    const d = supsRes?.data?.data || supsRes?.data;
    if (Array.isArray(d)) {
      return d.filter((s: any) => s.isActive).map((s: any) => ({ id: s.id, name: s.name }));
    }
    return [];
  }, [supsRes]);

  const products = useMemo(() => {
    const body = prodsRes;
    return body?.data?.data || body?.data || (Array.isArray(body) ? body : []);
  }, [prodsRes]);

  const filteredProducts = useMemo(() => {
    if (!prodSearch.trim()) return products.slice(0, 50); // Show recent 50 if empty
    const q = prodSearch.toLowerCase();
    return products.filter((p: any) => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.barcode?.toLowerCase().includes(q)
    ).slice(0, 100);
  }, [products, prodSearch]);

  const totalAmount = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = parseFloat(it.quantity) || 0;
      const c = parseFloat(it.purchaseCost) || 0;
      return acc + (q * c);
    }, 0);
  }, [items]);

  const addSelectedProduct = () => {
    if (!selectedProductId) return;
    const p = products.find((prod: any) => prod.id === selectedProductId);
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
        purchaseCost: p.latestPurchasePrice ? String(p.latestPurchasePrice) : (p.purchasePrice ? String(p.purchasePrice) : "0"),
        sellingPrice: p.latestSellingPrice ? String(p.latestSellingPrice) : (p.sellingPrice ? String(p.sellingPrice) : "0"),
        gstPercentage: "18",
        lineDiscount: p.discountPercentage ? String(p.discountPercentage) : "0",
        alertAt: String(p.reorderLevel ?? 10),
      },
    ]);
    setSelectedProductId("");
    setProdSearch("");
  };

  const removeLine = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
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
        initialStock: parseInt(l.quantity, 10),
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
        paidAmount: parseFloat(paidAmount) || 0,
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
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <Link to={`${base}/purchases`}>
                <ArrowLeft size={14} />
              </Link>
            </Button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Inventory / New Purchase
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Log New Receipt
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Receive stock and reconcile vendor balances
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 w-full"
      >
        <div className="space-y-8">
          {/* Header Information Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800/50 flex flex-col xl:flex-row items-center justify-between gap-10">
            {/* Header & Inputs Section */}
            <div className="flex-1 w-full space-y-8">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-blue-500" />
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                  Ledger Identification
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center overflow-x-auto custom-scrollbar no-scrollbar">
                    <Truck className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none shrink-0" />
                    <select
                      required
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="h-12 w-full min-w-max pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                    >
                      <option value="">Select Vendor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                    Receipt Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      required
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="h-12 pl-11 bg-slate-50 placeholder:text-slate-400 border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                  Internal Reference / Notes
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter batch notes or invoice reference..."
                    className="h-12 pl-11 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">
                  Initial Payment (Amount Paid Now)
                </label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                  <Input
                    type="number"
                    min={0}
                    max={totalAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-12 pl-11 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black text-sm text-emerald-600 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Section: Total & Action Group */}
            <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-8 xl:gap-10 shrink-0 border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-slate-800 pt-8 xl:pt-0 xl:pl-10">
              <div className="text-center sm:text-right w-full sm:w-auto">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Estimated Total Cost
                </h4>
                <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                  ₨ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full sm:w-auto min-w-[260px] h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all outline-none"
              >
                {saving ? "Committing Ledger..." : "Finalize & Receive Stock"}
              </Button>
            </div>
          </div>

          {/* Line Items Table Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
              <div className="flex flex-col sm:flex-row md:items-center gap-6 flex-1">
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400 flex items-center gap-2 shrink-0">
                  <ShoppingCart size={14} className="text-indigo-500" /> Product Selection
                </h3>
                
                <div className="relative w-full max-w-md group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Search size={14} className={cn("transition-colors", showResults ? "text-blue-500" : "text-slate-400")} />
                  </div>
                  <Input
                    value={prodSearch}
                    onChange={(e) => {
                        setProdSearch(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder="Type name or SKU to search..."
                    className="h-11 w-full pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 transition-all shadow-sm"
                  />
                  
                  {showResults && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {filteredProducts.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    setSelectedProductId(p.id);
                                    setProdSearch(p.name);
                                    setShowResults(false);
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-3 rounded-xl transition-all flex flex-col gap-0.5",
                                    selectedProductId === p.id 
                                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50" 
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent"
                                )}
                              >
                                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</span>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.sku} • {p.category?.name}</span>
                              </button>
                          ))}
                      </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={addSelectedProduct}
                disabled={!selectedProductId}
                className="h-11 px-8 bg-[#1E1B4B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all active:scale-95 shadow-xl shadow-indigo-950/20 flex items-center gap-2 shrink-0"
              >
                <Plus size={14} />
                <span>Add Product to Ledger</span>
              </Button>
            </div>

              <div className="overflow-x-auto custom-scrollbar -mx-2 px-2">
                <div className="min-w-[1000px]">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[22%]">Product</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[9%]">Unit</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[8%]">Qty/Unit</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[7%]">Qty</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Buy</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Sell</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[7%]">GST (18%)</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[8%]">Disc</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[9%]">Net Sell</th>
                        <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-[9%]">Reorder Level</th>
                        <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-[4%]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {items.map((line) => (
                        <tr
                          key={line.key}
                          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3 pr-2">
                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {line.name}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                              {line.category} • {line.sku}
                            </p>
                          </td>
                          <td className="py-3 pr-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                            {line.unitType}
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              value={line.qtyPerUnit}
                              onChange={(e) => updateLine(line.key, { qtyPerUnit: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              value={line.quantity}
                              onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              value={line.purchaseCost}
                              onChange={(e) => updateLine(line.key, { purchaseCost: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              value={line.sellingPrice}
                              onChange={(e) => updateLine(line.key, { sellingPrice: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              value={(parseFloat(line.sellingPrice || "0") * 0.18).toFixed(2)}
                              readOnly
                              disabled
                              className="h-9 w-full font-bold text-xs bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              value={line.lineDiscount}
                              onChange={(e) => updateLine(line.key, { lineDiscount: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              value={(parseFloat(line.sellingPrice || "0") * (1 - (parseFloat(line.lineDiscount || "0") / 100))).toFixed(2)}
                              readOnly
                              disabled
                              className="h-9 w-full font-bold text-xs bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70"
                            />
                          </td>
                          <td className="py-3 px-1">
                            <Input
                              type="number"
                              value={line.alertAt}
                              onChange={(e) => updateLine(line.key, { alertAt: e.target.value })}
                              className="h-9 w-full font-bold text-xs"
                            />
                          </td>
                          <td className="py-3 pl-1 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(line.key)}
                              className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-lg"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>

      </form>

    </div>
  );
}