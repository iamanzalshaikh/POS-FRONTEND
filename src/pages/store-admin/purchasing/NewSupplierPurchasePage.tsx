import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PageHeader from "@/components/global-components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/format";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { getSuppliers, createSupplierPurchase } from "@/api/suppliers.api";
import { fetchProducts } from "@/api/products.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

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
  const [lines, setLines] = useState<Line[]>([
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
    const lt = lines.map((l) => {
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
  }, [lines, paidAmount]);

  const addLine = () => {
    setLines((prev) => [...prev, { key: `${Date.now()}`, productId: "", quantity: "1", unitPrice: "" }]);
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const updateLine = (key: string, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!supplierId) {
      setError("Select a supplier.");
      return;
    }
    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        quantity: parseInt(l.quantity, 10),
        unitPrice: parseFloat(l.unitPrice),
      }));
    for (const it of items) {
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        setError("Each line needs a positive whole-number quantity.");
        return;
      }
      if (Number.isNaN(it.unitPrice) || it.unitPrice < 0) {
        setError("Each line needs a valid unit price.");
        return;
      }
    }
    if (items.length === 0) {
      setError("Add at least one product line.");
      return;
    }
    if (paidNum > grandTotal + 0.0001) {
      setError("Paid amount cannot exceed the grand total.");
      return;
    }

    setSaving(true);
    try {
      const res = await createSupplierPurchase({
        supplierId,
        purchaseDate: new Date(purchaseDate + "T12:00:00").toISOString(),
        items,
        paidAmount: paidNum,
        notes: notes.trim() || undefined,
      });
      const id = res.data?.data?.id;
      if (id) navigate(`${base}/purchases/${id}`);
      else navigate(`${base}/purchases`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create purchase");
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === "ACCOUNTANT") {
    return <Navigate to={`${base}/purchases`} replace />;
  }

  return (
    <div className="space-y-6 normal-case max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="gap-1">
          <Link to={`${base}/purchases`}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <PageHeader
        title="New supplier purchase"
        description="Adds stock (new batches) and records what you owe the supplier."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Header</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Supplier *</label>
              <select
                required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Purchase date *</label>
              <Input
                type="date"
                required
                className="mt-1"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
              <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
              <Plus className="h-4 w-4" />
              Add line
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit cost</TableHead>
                  <TableHead>Line total</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.key}>
                    <TableCell>
                      <select
                        className="h-9 w-full min-w-[200px] rounded-md border border-input bg-background px-2 text-sm"
                        value={line.productId}
                        onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        className="w-24"
                        value={line.quantity}
                        onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-28"
                        value={line.unitPrice}
                        onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(lineTotals[idx] || 0)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(line.key)}
                        disabled={lines.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3 max-w-md">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Grand total</span>
              <span className="font-semibold">{formatCurrency(grandTotal)}</span>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Paid now</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="mt-1"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-slate-600">Balance due</span>
              <span className={`font-semibold ${balance > 0 ? "text-amber-700" : ""}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving…" : "Save purchase & receive stock"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
