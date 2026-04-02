import React, { useEffect, useMemo } from 'react';
import { useStoreStore } from '../../store/useStoreStore';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    MoreVertical,
    Eye,
    Edit2,
    Trash2,
    Power,
    MapPin,
    Shield
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { showToast } from '../../utils/admin-toast';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';

const StoresListPage: React.FC = () => {
    const { stores, isLoading, fetchStores, toggleStoreStatus } = useStoreStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const success = await toggleStoreStatus(id, !currentStatus);
        if (success) {
            showToast(`Store ${!currentStatus ? 'Activated' : 'Deactivated'} Successfully`);
        } else {
            showToast('Failed to update store status', 'error');
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
                <div className="flex flex-col text-left">
                    <span className="font-black text-slate-900 dark:text-white text-sm tracking-tight leading-tight">
                        {formatStoreName(row.original.name)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {row.original.email || 'NO_ENDPOINT_LINKED'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "city",
            header: "Store City",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-slate-400" />
                    <span className="text-sm text-slate-900 dark:text-slate-200 font-bold tracking-tight">
                        {row.getValue("city") || 'Universal Node'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "state",
            header: "Region",
            cell: ({ row }) => (
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
                    {row.original.state || 'National Port'}
                </span>
            )
        },
        {
            accessorKey: "ownerName",
            header: "Owner Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-indigo-600 text-[10px]">
                        { (row.original.owner?.name?.[0] || 'U').toUpperCase() }
                    </div>
                    <span className="text-sm text-slate-900 dark:text-slate-200 font-bold">
                        {row.original.owner?.name || row.original.ownerName || 'Unassigned Root'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }) => {
                const active = row.original.isActive;
                return (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {active ? 'Active' : 'Inactive'}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Action",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-slate-100 rounded-full transition-all active:scale-90">
                                <MoreVertical className="h-5 w-5 text-black" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border-slate-900 shadow-2xl p-2 bg-white ring-1 ring-black/5">
                        <DropdownMenuItem 
                            onClick={() => navigate(`/super-admin/stores/${row.original.id}`)}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest cursor-pointer"
                        >
                            <Eye size={14} className="text-slate-400" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => navigate(`/super-admin/stores/edit/${row.original.id}`)}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest cursor-pointer"
                        >
                            <Edit2 size={14} className="text-slate-400" />
                            Edit Node
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => handleToggleStatus(row.original.id, row.original.isActive)}
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                        >
                            <Power size={14} />
                            {row.original.isActive ? 'Suspend' : 'Reactive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                        >
                            <Trash2 size={14} />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ], [toggleStoreStatus, navigate]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stores Directory</h1>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Manage system branches and provisioned network nodes</p>
                </div>
                <button
                    onClick={() => navigate('/super-admin/stores/create')}
                    className="flex items-center gap-2 px-6 py-4 bg-[#262255] text-white rounded-[20px] font-bold text-[11px] uppercase tracking-[2px] shadow-xl shadow-indigo-900/10 hover:bg-[#312E81] transition-all active:scale-95 border-b-4 border-indigo-950"
                >
                    <Plus size={16} />
                    Provision New Node
                </button>
            </div>

            <DataTable
                columns={columns}
                data={stores}
                isLoading={isLoading}
                searchKey="name"
                placeholder="Filter network by store name..."
                onRefresh={fetchStores}
            />
        </div>
    );
};

export default StoresListPage;
