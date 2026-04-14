import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Truck, 
    Users, 
    UserCheck, 
    History,
    Search,
    Plus,
    Edit2, 
    Power,
    ShieldAlert,
    Ban
} from 'lucide-react';
import { 
    getSuppliers, 
    createSupplier, 
    updateSupplier, 
    type Supplier 
} from "@/api/suppliers.api";
import { useAuthStore } from "@/store/useAuthStore";
import { usePurchasingBasePath } from "@/hooks/usePurchasingBasePath";
import MetricCard from '@/components/global-components/MetricCard';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import AddSupplierModal from '@/components/store-admin/purchasing/AddSupplierModal';

export default function SuppliersPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = userAuth?.role === "ACCOUNTANT";
    const base = usePurchasingBasePath();

    const [list, setList] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const loadSuppliers = async () => {
        setLoading(true);
        try {
            const res = await getSuppliers({ activeOnly: false });
            const raw = res.data?.data;
            setList(Array.isArray(raw) ? raw : []);
        } catch (e: any) {
            console.error("Failed to load suppliers:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleAddSupplier = async (data: any) => {
        try {
            await createSupplier(data);
            await loadSuppliers();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.message || "Failed to create supplier" };
        }
    };

    const handleEditSupplier = async (id: string, data: any) => {
        try {
            await updateSupplier(id, data);
            await loadSuppliers();
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.message || "Failed to update supplier" };
        }
    };

    const handleToggleStatus = async (s: Supplier) => {
        try {
            await updateSupplier(s.id, { isActive: !s.isActive });
            await loadSuppliers();
        } catch (err: any) {
            console.error("Update failed:", err);
        }
    };

    const columns: ColumnDef<Supplier>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="flex justify-center uppercase tracking-widest text-[11px] font-black text-slate-400">
                    {row.original.id.slice(-4)}
                </div>
            )
        },
        {
            header: "Vendor Name",
            accessorKey: "name",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{row.original.name}</p>
            )
        },
        {
            header: "Contact Phone",
            accessorKey: "phone",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="font-bold text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.05em]">
                    {row.original.phone || "—"}
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "isActive",
            cell: ({ row }) => {
                const active = row.original.isActive;
                return (
                    <div className="flex justify-center">
                        <span className={cn(
                            "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border",
                            active 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
                                : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
                        )}>
                            {active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: "Location",
            accessorKey: "address",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[200px]">
                    {row.original.address || "—"}
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    {!readOnly && (
                        <>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    setSelectedSupplier(row.original);
                                    setIsModalOpen(true);
                                }}
                                className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-95 shadow-none border-none group/action"
                                title="Edit Supplier"
                            >
                                <Edit2 size={16} className="group-hover/action:scale-110 transition-transform" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleStatus(row.original)}
                                className={cn(
                                    "h-9 w-9 p-0 rounded-xl transition-all active:scale-95 shadow-none border-none group/action",
                                    row.original.isActive
                                        ? "hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600" 
                                        : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"
                                )}
                                title={row.original.isActive ? 'Deactivate' : 'Activate'}
                            >
                                {row.original.isActive ? <Ban size={16} className="group-hover/action:scale-110 transition-transform" /> : <Power size={16} className="group-hover/action:scale-110 transition-transform" />}
                            </Button>
                        </>
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="h-9 w-9 p-0 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95 shadow-none border-none group/action"
                        title="View Purchases"
                    >
                        <Link to={`${base}/purchases?supplierId=${row.original.id}`}>
                            <History size={16} className="group-hover/action:scale-110 transition-transform" />
                        </Link>
                    </Button>
                </div>
            )
        }
    ];

    const filteredList = list.filter(s => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
        const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? s.isActive : !s.isActive);
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Suppliers Directory</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage vendor relations and procurement</p>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => {
                            setSelectedSupplier(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-400/20 border border-blue-500"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Supplier
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <MetricCard 
                    title="Total Vendors" 
                    value={list.length} 
                    icon={Truck} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Active Partners" 
                    value={list.filter(s => s.isActive).length} 
                    icon={UserCheck} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Dormant Accounts" 
                    value={list.filter(s => !s.isActive).length} 
                    icon={ShieldAlert} 
                    colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                />
            </div>

            {loading ? (
                <div className="space-y-10 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <Skeleton className="h-10 w-64 rounded-xl" />
                            <div className="flex gap-3">
                                <Skeleton className="h-10 w-32 rounded-xl" />
                                <Skeleton className="h-10 w-32 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none">
                    <DataTable 
                        columns={columns} 
                        data={filteredList}
                        isLoading={loading}
                        onRefresh={loadSuppliers}
                        placeholder="Search vendors..."
                        hidePagination={false}
                        manualPagination={false}
                        exportFilename="Suppliers-Records"
                        headerActions={
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Identify supplier..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[140px] h-10"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Inactive">Inactive Only</option>
                                </select>
                            </div>
                        }
                    />
                </div>
            )}

            <AddSupplierModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSupplier(null);
                }}
                editSupplier={selectedSupplier}
                onAdd={handleAddSupplier}
                onEdit={handleEditSupplier}
            />
        </div>
    );
}
