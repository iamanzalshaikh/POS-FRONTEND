import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts } from "@/api/products.api";
import { recordOpeningStock } from "@/api/inventory.api";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  FileText, 
  Plus,
  ShoppingCart,
  AlertCircle,
  Trash2,
  Table
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

type ProductRow = {
    key: string;
    productId: string;
    name: string;
    category: string;
    sku: string;
    purchasePrice: string;
    sellingPrice: string;
    quantity: string;
    taxPercentage: string;
    discountPercentage: string;
};

export default function OpeningStockPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProductRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: prodsRes } = useQuery({
    queryKey: ['products-catalog-lite'],
    queryFn: () => fetchProducts({ isActive: true, limit: 1000 }),
    staleTime: 1000 * 60 * 10,
  });

  const products = useMemo(() => {
    const body = prodsRes;
    return body?.data?.data || body?.data || (Array.isArray(body) ? body : []);
  }, [prodsRes]);

  const totalValue = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = parseFloat(it.quantity) || 0;
      const c = parseFloat(it.purchasePrice) || 0;
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
        category: p.category?.name || "General",
        sku: p.sku || "",
        quantity: "1",
        purchasePrice: p.purchasePrice ? String(p.purchasePrice) : "0",
        sellingPrice: p.sellingPrice ? String(p.sellingPrice) : "0",
        taxPercentage: p.taxPercentage ? String(p.taxPercentage) : "0",
        discountPercentage: p.discountPercentage ? String(p.discountPercentage) : "0",
      },
    ]);
    setSelectedProductId("");
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

    if (items.length === 0) {
      setError("Please add at least one product to record opening stock.");
      return;
    }

    const apiItems = items.map((l) => ({
      productId: l.productId,
      quantity: parseFloat(l.quantity),
      purchasePrice: parseFloat(l.purchasePrice),
      sellingPrice: parseFloat(l.sellingPrice),
      taxPercentage: parseFloat(l.taxPercentage),
      discountPercentage: parseFloat(l.discountPercentage),
    }));

    for (const it of apiItems) {
      if (it.quantity <= 0) {
        setError("All items must have a quantity greater than zero.");
        return;
      }
      if (it.purchasePrice < 0) {
        setError("Purchase price cannot be negative.");
        return;
      }
    }

    setSaving(true);
    try {
      await recordOpeningStock({
        items: apiItems,
        purchaseDate: new Date(purchaseDate + "T12:00:00").toISOString(),
        notes: notes.trim() || undefined,
      });
      
      toast.success("Opening stock recorded as a payable liability.", "Inventory Initialized");
      
      // Invalidate queries to refresh balances and stock
      queryClient.invalidateQueries({ queryKey: ['opening-stock-history'] });
      
      navigate("/store-admin/purchasing/opening-stock");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to record opening stock.";
      setError(msg);
      toast.error(msg, "Error Recording Stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10 max-w-[96rem] w-full pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild className="h-8 px-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <Link to="/store-admin/purchasing/opening-stock">
                <ArrowLeft size={14} />
              </Link>
            </Button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Purchasing / Opening Stock
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Record Opening Stock
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
            Initialize inventory and record investment liability
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Form Area */}
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50 space-y-8">
              <div className="flex items-center gap-2">
                <Table size={14} className="text-indigo-500" />
                <h3 className="text-[11px] font-black uppercase tracking-[3px] text-slate-400">Inventory Items</h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="h-12 w-full pl-11 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Search Product...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <Button type="button" onClick={addSelectedProduct} className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold shrink-0">
                  <Plus size={16} className="mr-2" /> Add to List
                </Button>
              </div>

              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                      <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Quantity</th>
                      <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Buy Price</th>
                      <th className="pb-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">Sell Price</th>
                      <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {items.map((it) => (
                      <tr key={it.key} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">{it.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{it.category} • {it.sku}</div>
                        </td>
                        <td className="py-4 pr-4">
                          <Input
                            type="number"
                            value={it.quantity}
                            onChange={(e) => updateLine(it.key, { quantity: e.target.value })}
                            className="h-10 font-bold text-sm text-center"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <Input
                            type="number"
                            value={it.purchasePrice}
                            onChange={(e) => updateLine(it.key, { purchasePrice: e.target.value })}
                            className="h-10 font-bold text-sm"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <Input
                            type="number"
                            value={it.sellingPrice}
                            onChange={(e) => updateLine(it.key, { sellingPrice: e.target.value })}
                            className="h-10 font-bold text-sm"
                          />
                        </td>
                        <td className="py-4 text-right">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeLine(it.key)}
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <ShoppingCart className="w-10 h-10 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No products added yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar / Summary Area */}
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800/50 space-y-6 shadow-xl shadow-slate-200/20">
              <div className="space-y-1.5 text-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Valuation</h4>
                <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                  ₨ {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/50 text-[9px] font-black uppercase tracking-widest mt-2">
                  <AlertCircle size={10} />
                  Will be recorded as liability
                </div>
              </div>

              <div className="h-px bg-slate-50 dark:bg-slate-800" />

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Recording Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="h-10 pl-10 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Batch Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Migration reference..."
                      className="h-10 pl-10 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving || items.length === 0}
                className="w-full h-14 bg-indigo-600 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                {saving ? "Processing..." : "Commit Opening Stock"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
