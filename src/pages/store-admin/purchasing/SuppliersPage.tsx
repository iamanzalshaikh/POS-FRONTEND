import React, { useState, useEffect, useMemo } from 'react';
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
    Ban,
    RefreshCw,
    Box
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
import SupplierPendingReturnsList from '@/components/store-admin/purchasing/SupplierPendingReturnsList';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks';

export default function SuppliersPage() {
    const userAuth = useAuthStore((s) => s.user);
    const readOnly = false; // Allow both Admin and Accountant to edit
    const base = usePurchasingBasePath();
    
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [activeTab, setActiveTab] = useState<'directory' | 'pending'>('directory');

    const { data: suppliersRes, isLoading: loading, refetch: loadSuppliers } = useQuery({
        queryKey: ['suppliers', statusFilter],
        queryFn: () => getSuppliers({ activeOnly: statusFilter === 'Active' }),
        staleTime: 1000 * 60 * 5,
    });

    const list = useMemo(() => {
        const raw = suppliersRes?.data?.data || suppliersRes?.data;
        return Array.isArray(raw) ? raw : [];
    }, [suppliersRes]);

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

    const columns: ColumnDef<Supplier>[] = useMemo(() => [
        {
            id: "vendorId",
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
            meta: { align: 'center' },
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{row.original.name}</p>
                </div>
            )
        },
        {
            header: "Contact Phone",
            accessorKey: "phone",
            meta: { align: 'center' },
            cell: ({ row }) => (
                <div className="font-bold text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.05em]">
                    {row.original.phone || "—"}
                </div>
            )
        },
        {
            header: "Outstanding Balance",
            accessorKey: "totalBalance",
            meta: { align: 'center' },
            cell: ({ row }) => {
                const supplier = row.original;
                const balance = Number(supplier.totalBalance || 0);
                
                return (
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "font-black text-xs tabular-nums text-center",
                            balance > 0 ? "text-rose-500" : "text-emerald-500"
                        )}>
                            ₨ {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex flex-col mt-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight leading-tight">
                                Payable: ₨ {(Number(supplier.supplierPayable || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight leading-tight">
                                Paid: ₨ {(Number(supplier.supplierPaid || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                );
            }
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
            id: "location",
            meta: { align: 'center' },
            cell: ({ row }) => {
                const { city, state, addressLine } = row.original;
                const parts = [addressLine, city, state].filter(Boolean);
                const locationString = parts.join(", ");
                return (
                    <div 
                        className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate max-w-[250px]"
                        title={locationString}
                    >
                        {locationString || "—"}
                    </div>
                );
            }
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
    ], [readOnly, base]);

    const filteredList = useMemo(() => {
        return list.filter(s => {
            const q = debouncedSearch.toLowerCase();
            const matchesSearch = s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
            const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? s.isActive : !s.isActive);
            return matchesSearch && matchesStatus;
        });
    }, [list, debouncedSearch, statusFilter]);

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Suppliers Directory</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage vendor relations and procurement</p>
                </div>
                {!readOnly && (
                    <Button
                        onClick={() => {
                            setSelectedSupplier(null);
                            setIsModalOpen(true);
                        }}
                        className="h-14 px-8 bg-[#1E1B4B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-opacity-90 transition-all active:scale-95 shadow-xl shadow-indigo-950/20 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Supplier
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] w-fit border border-slate-200 dark:border-slate-800/50 mt-8 mb-4">
                <button
                    onClick={() => setActiveTab('directory')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                        activeTab === 'directory' 
                            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    <Truck size={14} />
                    Vendors Directory
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                        activeTab === 'pending' 
                            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    <Box size={14} />
                    Pending Returns
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {activeTab === 'directory' ? (
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
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col gap-1 px-4">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Resolvable Actions</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Handle damage/return adjustments for suppliers</p>
                    </div>
                    <SupplierPendingReturnsList />
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

