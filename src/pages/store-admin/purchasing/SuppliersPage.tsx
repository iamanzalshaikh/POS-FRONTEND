import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/global-components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Truck } from "lucide-react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  type Supplier,
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";

export default function SuppliersPage() {
  const user = useAuthStore((s) => s.user);
  const readOnly = user?.role === "ACCOUNTANT";
  const base = usePurchasingBasePath();
  const [list, setList] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSuppliers({ activeOnly: false });
      const raw = res.data?.data;
      setList(Array.isArray(raw) ? raw : []);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPhone("");
    setAddress("");
    setShowForm(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setName(s.name);
    setPhone(s.phone || "");
    setAddress(s.address || "");
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateSupplier(editing.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
      } else {
        await createSupplier({
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: Supplier) => {
    try {
      await updateSupplier(s.id, { isActive: !s.isActive });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-6 normal-case">
      <PageHeader
        title="Suppliers"
        description={
          readOnly ? "Read-only vendor directory (accountant)." : "Vendors you purchase stock from."
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="flex flex-wrap gap-3">
        {!readOnly && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add supplier
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link to={`${base}/purchases`}>View purchases</Link>
        </Button>
        {!readOnly && (
          <Button variant="outline" asChild>
            <Link to={`${base}/purchases/new`}>New purchase</Link>
          </Button>
        )}
      </div>

      {showForm && !readOnly && (
        <Card className="border-indigo-100 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">{editing ? "Edit supplier" : "New supplier"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 max-w-lg">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Address</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-base">All suppliers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No suppliers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.phone || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.address || "—"}</TableCell>
                    <TableCell>{s.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap">
                      {!readOnly && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="gap-1">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`${base}/purchases?supplierId=${s.id}`}>Purchases</Link>
                      </Button>
                      {!readOnly && (
                        <Button variant="outline" size="sm" onClick={() => toggleActive(s)}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      )}
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
