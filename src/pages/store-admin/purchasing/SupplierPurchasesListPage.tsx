import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/global-components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/format";
import { Plus, ClipboardList } from "lucide-react";
import { getSupplierPurchases, getSuppliers, type SupplierPurchase } from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

function num(v: string | number | undefined): number {
  if (v === undefined || v === null) return 0;
  return typeof v === "number" ? v : parseFloat(String(v)) || 0;
}

export default function SupplierPurchasesListPage() {
  const user = useAuthStore((s) => s.user);
  const readOnly = user?.role === "ACCOUNTANT";
  const base = usePurchasingBasePath();
  const [searchParams] = useSearchParams();
  const filterSupplierId = searchParams.get("supplierId") || "";

  const [rows, setRows] = useState<SupplierPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [supplierFilter, setSupplierFilter] = useState(filterSupplierId);

  useEffect(() => {
    setSupplierFilter(filterSupplierId);
  }, [filterSupplierId]);

  const load = async () => {
    setLoading(true);
    setError(null);
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
      setError(e.response?.data?.message || e.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [supplierFilter]);

  useEffect(() => {
    void getSuppliers().then((r) => {
      const d = r.data?.data;
      if (Array.isArray(d)) setSuppliers(d.map((s) => ({ id: s.id, name: s.name })));
    });
  }, []);

  return (
    <div className="space-y-6 normal-case">
      <PageHeader
        title="Supplier purchases"
        description={
          readOnly
            ? "Read-only list of stock receipts (accountant)."
            : "Stock receipts and balances. Selecting a supplier filters the list."
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Button asChild className="gap-2">
          <Link to="/store-admin/purchasing/purchases/new">
            <Plus className="h-4 w-4" />
            New purchase
          </Link>
        </Button>
        <div>
          <label className="text-xs font-semibold uppercase text-slate-500 block mb-1">Supplier</label>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[200px]"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" asChild>
          <Link to={`${base}/suppliers`}>Suppliers</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-base">Purchases ({total})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No purchases found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell>{p.supplier?.name || "—"}</TableCell>
                    <TableCell>{formatCurrency(num(p.totalAmount))}</TableCell>
                    <TableCell>{formatCurrency(num(p.paidAmount))}</TableCell>
                    <TableCell className={num(p.balance) > 0 ? "text-amber-700 font-medium" : ""}>
                      {formatCurrency(num(p.balance))}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${base}/purchases/${p.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
