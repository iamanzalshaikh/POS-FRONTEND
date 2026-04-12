import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/global-components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/format";
import { ArrowLeft } from "lucide-react";
import {
  getSupplierPurchase,
  createSupplierPayment,
  type SupplierPurchase,
  type SupplierPurchasePayment,
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

function num(v: string | number | undefined): number {
  if (v === undefined || v === null) return 0;
  return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export default function SupplierPurchaseDetailPage() {
  const user = useAuthStore((s) => s.user);
  const readOnly = user?.role === "ACCOUNTANT";
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

  const load = async () => {
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
    void load();
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
      setPayError(`Amount cannot exceed balance (${formatCurrency(balance)}).`);
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
      setPayAmount("");
      setPayNotes("");
      await load();
    } catch (err: any) {
      setPayError(err.response?.data?.message || err.message || "Payment failed");
    } finally {
      setPaySaving(false);
    }
  };

  if (loading) {
    return (
      <div className="normal-case p-8 text-slate-500 text-center">Loading…</div>
    );
  }

  if (error || !purchase) {
    return (
      <div className="normal-case space-y-4">
        <Button variant="outline" asChild>
          <Link to={`${base}/purchases`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Link>
        </Button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error || "Purchase not found."}
        </div>
      </div>
    );
  }

  const payments = (purchase.payments || []) as SupplierPurchasePayment[];

  return (
    <div className="space-y-6 normal-case max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={`${base}/purchases`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`Purchase — ${purchase.supplier?.name || "Supplier"}`}
        description={`${new Date(purchase.purchaseDate).toLocaleString()} · Recorded by ${purchase.user?.name || "—"}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
            <p className="text-xl font-bold">{formatCurrency(num(purchase.totalAmount))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-slate-500">Paid</p>
            <p className="text-xl font-bold">{formatCurrency(num(purchase.paidAmount))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-semibold uppercase text-slate-500">Balance</p>
            <p className={`text-xl font-bold ${balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {formatCurrency(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {purchase.notes && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-600">{purchase.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items (stock batches)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit cost</TableHead>
                <TableHead>Line total</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(purchase.items || []).map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="font-medium">{it.product?.name || "—"}</TableCell>
                  <TableCell>{it.product?.sku || "—"}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{formatCurrency(num(it.unitPrice))}</TableCell>
                  <TableCell>{formatCurrency(num(it.totalPrice))}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {it.batch?.batchNumber || it.batchId?.slice(0, 8) || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No follow-up payments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(num(p.amount))}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell>{p.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {balance > 0 && !readOnly && (
        <Card className="border-amber-100 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base">Record payment</CardTitle>
          </CardHeader>
          <CardContent>
            {payError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {payError}
              </div>
            )}
            <form onSubmit={submitPayment} className="grid gap-4 max-w-lg sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Amount *</label>
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  max={balance}
                  className="mt-1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Date *</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Method *</label>
                <select
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
                <Input className="mt-1" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={paySaving}>
                  {paySaving ? "Saving…" : "Record payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
