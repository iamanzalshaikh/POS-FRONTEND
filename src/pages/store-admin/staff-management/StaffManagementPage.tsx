import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    UserCheck, 
    ShieldCheck, 
    BadgeInfo,
    Search,
    MoreVertical, 
    Edit2, 
    Trash2 
} from 'lucide-react';
import AddStaffModal from '@/components/store-admin/AddStaffModal';
import MetricCard from '@/components/global-components/MetricCard';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { StaffStatusBadge, RoleBadge } from '@/components/store-admin/StaffStatusBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { StaffMember, CreateStaffInput, StaffRole, StaffStatus } from './types/staff.types';
import { useUserStore } from '../../../store/useUserStore';

function formatActivity(value?: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Never';
}

function mapApiUser(u: any): StaffMember {
    return {
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        role: u.role as StaffRole,
        status: u.isActive ? 'active' : 'inactive',
        lastLogin: formatActivity(u.lastLoginAt),
        lastLogout: formatActivity(u.lastLogoutAt),
        assignedTerminals: u.assignedTerminals || [],
    };
}


export default function StaffManagementPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<StaffMember | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<StaffStatus | 'All'>('All');

    const { users, isLoading, fetchUsers, createUser, updateUser, toggleUserStatus } = useUserStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const staff: StaffMember[] = users.map(mapApiUser);

    const columns: ColumnDef<StaffMember>[] = [
        {
            header: "ID",
            cell: ({ row }) => (
                <div className="flex justify-center uppercase tracking-widest text-[11px] font-black text-slate-400">
                    {row.original.id.slice(-4)}
                </div>
            )
        },
        {
            header: "Name",
            accessorKey: "name",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">{row.getValue("name")}</p>
            )
        },
        {
            header: "Email",
            accessorKey: "email",
            meta: { align: 'left' },
            cell: ({ row }) => (
                <div className="font-bold text-[10px] lowercase text-slate-500 dark:text-slate-400 tracking-[0.05em]">
                    {row.getValue<string>("email").toLowerCase()}
                </div>
            )
        },
        {
            header: "Role",
            accessorKey: "role",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <RoleBadge role={row.getValue("role")} />
                </div>
            )
        },
        {
            header: "Status",
            accessorKey: "status",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <StaffStatusBadge status={row.getValue("status")} />
                </div>
            )
        },
        {
            header: "Activity",
            cell: ({ row }) => {
                const member = row.original;
                const loginDate = member.lastLogin !== 'Never' ? new Date(member.lastLogin) : null;
                const logoutDate = member.lastLogout !== 'Never' ? new Date(member.lastLogout) : null;
                
                // Logic: If login is more recent than logout, they are currently in an active session
                const isActiveSession = loginDate && (!logoutDate || loginDate > logoutDate);

                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                            IN: {member.lastLogin || 'Never'}
                        </span>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            isActiveSession 
                                ? "text-emerald-500 animate-pulse" 
                                : "text-slate-400 dark:text-slate-500"
                        )}>
                            OUT: {isActiveSession ? 'ACTIVE SESSION' : (member.lastLogout || 'Never')}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                            setSelectedStaffToEdit(row.original);
                            setIsModalOpen(true);
                        }}
                        className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 rounded-xl transition-all active:scale-95 shadow-none border-none group/action"
                        title="Edit Staff"
                    >
                        <Edit2 size={16} className="group-hover/action:scale-110 transition-transform" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleStatus(row.original.id, row.original.status !== 'active')}
                        className={cn(
                            "h-9 w-9 p-0 rounded-xl transition-all active:scale-95 shadow-none border-none group/action",
                            row.original.status === 'active' 
                                ? "hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600" 
                                : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"
                        )}
                        title={row.original.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                        <Trash2 size={16} className="group-hover/action:scale-110 transition-transform" />
                    </Button>
                </div>
            )
        }
    ];

    const filteredStaff = staff.filter(member => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            member.name.toLowerCase().includes(q) ||
            member.email.toLowerCase().includes(q) ||
            member.id.includes(searchQuery);
        const matchesRole = roleFilter === 'All' || member.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });


    const handleAddStaff = async (data: CreateStaffInput): Promise<{ success: boolean; error?: string }> => {
        const success = await createUser(data);
        if (success) {
            await fetchUsers();
        }
        return { success, error: success ? undefined : 'Failed to create staff' };
    };

    const handleEditStaff = async (id: string, data: any): Promise<{ success: boolean; error?: string }> => {
        const success = await updateUser(id, data);
        if (success) {
            await fetchUsers();
        }
        return { success, error: success ? undefined : 'Failed to update user details' };
    };

    const handleToggleStatus = async (id: string, active: boolean) => {
        await toggleUserStatus(id, active);
    };

    return (
        <div className="animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Management</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage your team and access levels</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-400/20 border border-blue-500"
                >
                    <Users className="w-4 h-4" />
                    Add Staff Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <MetricCard 
                    title="Total Team" 
                    value={String(staff.length)} 
                    icon={Users} 
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard 
                    title="Active Now" 
                    value={String(staff.filter((m: any) => m.status === 'active').length)} 
                    icon={UserCheck} 
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Managers" 
                    value={String(staff.filter((m: any) => m.role === 'ADMIN').length)} 
                    icon={ShieldCheck} 
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                />
                <MetricCard 
                    title="Cashiers" 
                    value={String(staff.filter((m: any) => m.role === 'CASHIER').length)} 
                    icon={BadgeInfo} 
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                />
            </div>

            {isLoading ? (
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
                        data={filteredStaff}
                        isLoading={isLoading}
                        onRefresh={fetchUsers}
                        placeholder="Filter list..."
                        hidePagination={false}
                        manualPagination={false}
                        exportFilename="Staff-Records"
                        headerActions={
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'All')}
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[140px] h-10"
                                >
                                    <option value="All">All Roles</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="CASHIER">Cashier</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as StaffStatus | 'All')}
                                    className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[140px] h-10"
                                >
                                    <option value="All">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                        }
                    />
                </div>
            )}

            <AddStaffModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedStaffToEdit(undefined);
                }}
                editMember={selectedStaffToEdit}
                onAdd={handleAddStaff}
                onEdit={handleEditStaff}
            />
        </div>
    );
}
