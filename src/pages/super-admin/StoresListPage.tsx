import React, { useEffect, useMemo } from 'react';
import { useStoreStore } from '../../store/useStoreStore';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Eye,
    Edit2,
    Power,
    Warehouse
} from 'lucide-react';
import PageHeader from '@/components/global-components/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

const StoresListPage: React.FC = () => {
    const { stores, isLoading, fetchStores, toggleStoreStatus } = useStoreStore();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const success = await toggleStoreStatus(id, !currentStatus);
        if (success) {
            toast({
                title: "Status Updated",
                description: `Store ${!currentStatus ? 'Activated' : 'Deactivated'} Successfully`,
                variant: "success"
            });
        } else {
            toast({
                title: "Update Failed",
                description: 'Failed to update store status',
                variant: "destructive"
            });
        }
    };

    const formatStoreName = (raw: string) => {
        if (!raw) return '';
        let s = raw.replace(/^(STR|STORE|S)[\W_:\-]*\d*/i, '');
        s = s.replace(/^[\d\W_]+/, '');
        s = s.replace(/\d+/g, '');
        s = s.replace(/[_\-]+/g, ' ').trim();
        s = s.replace(/\s{2,}/g, ' ');
        return s || raw;
    };

    const columns: ColumnDef<any>[] = useMemo(() => [
        {
            accessorKey: "id",
            header: "Store ID",
            cell: ({ row }) => (
                <span className="font-bold text-slate-400 text-xs">
                    {(row.index + 1).toString().padStart(2, '0')}
                </span>
            )
        },
        {
            accessorKey: "name",
            header: "Store Name",
            cell: ({ row }) => (
                <div className="text-left text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {formatStoreName(row.original.name)}
                </div>
            )
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
                    {row.original.email || 'None'}
                </div>
            )
        },
        {
            accessorKey: "city",
            header: "City",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
                        {row.getValue("city") || 'Universal'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "ownerName",
            header: "Owner",
            cell: ({ row }) => (
                <div className="text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                    {row.original.owner?.name || row.original.ownerName || 'Root'}
                </div>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const active = row.original.isActive;
                return (
                    <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            active 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50' 
                                : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {active ? 'Active' : 'Suspended'}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    <button
                        onClick={() => navigate(`/super-admin/stores/${row.original.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                        title="Store Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => navigate(`/super-admin/stores/edit/${row.original.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                        title="Edit Store"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleToggleStatus(row.original.id, row.original.isActive)}
                        className={`p-2 rounded-lg transition-all ${row.original.isActive 
                            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30' 
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        title={row.original.isActive ? "Suspend Store" : "Restore Store"}
                    >
                        <Power size={16} />
                    </button>
                </div>
            )
        }
], [toggleStoreStatus, navigate]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Stores"
                description="Manage all store locations"
                icon={Warehouse}
                primaryAction={{
                    label: "Add New Store",
                    onClick: () => navigate('/super-admin/stores/create'),
                    icon: Plus
                }}
            />

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10 border border-slate-100 dark:border-slate-800">
                <DataTable
                    columns={columns}
                    data={stores}
                    isLoading={isLoading}
                    onRefresh={fetchStores}
                    placeholder="Filter network nodes..."
                />
            </div>
        </div>
    );
};

export default StoresListPage;
