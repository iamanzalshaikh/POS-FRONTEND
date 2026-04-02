import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffHeader from '@/components/store-admin/StaffHeader';
import StaffFilters from '@/components/store-admin/StaffFilters';
import StaffTable from '@/components/store-admin/StaffTable';
import StaffPagination from '@/components/store-admin/StaffPagination';
import AddStaffModal from '@/components/store-admin/AddStaffModal';
import StatsCards from '@/components/global-components/StatsCards';
import type { StaffMember, CreateStaffInput, StaffRole, StaffStatus } from './types/staff.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStaffMembers, createStaffMember, updateStaffMember } from '@/api/staff.api';

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
    };
}

export default function StaffManagementPage() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<StaffMember | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<StaffStatus | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const queryClient = useQueryClient();
    // React Query Hooks
    const { data: staffDataRes, isLoading: loading, refetch: refetchStaff } = useQuery({
        queryKey: ['staff'],
        queryFn: fetchStaffMembers,
    });
    const createStaffMutation = useMutation({
        mutationFn: createStaffMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
    const updateStaffMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateStaffMember(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    const staffRaw = (staffDataRes as any)?.data || (Array.isArray(staffDataRes) ? staffDataRes : []);
    const staff: StaffMember[] = Array.isArray(staffRaw) ? staffRaw.map(mapApiUser) : [];

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

    const totalCount = filteredStaff.length;
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
    const paginatedStaff = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleAddStaff = async (data: CreateStaffInput): Promise<{ success: boolean; error?: string }> => {
        try {
            await createStaffMutation.mutateAsync(data);
            return { success: true };
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to create staff';
            return { success: false, error: msg };
        }
    };

    const handleToggleStatus = async (id: string, active: boolean) => {
        await updateStaffMutation.mutateAsync({ id, data: { isActive: active } });
    };

    const handleEditStaff = async (id: string, data: any): Promise<{ success: boolean; error?: string }> => {
        try {
            await updateStaffMutation.mutateAsync({ id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Failed to update user details' };
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <StaffHeader
                onAddStaff={() => setIsModalOpen(true)}
                onExport={() => alert('Export CSV feature coming soon!')}
                onRefresh={() => refetchStaff()}
            />

            <div className="mt-8">
                <StatsCards data={[
                    { name: "Total Team", stat: String(staff.length), change: "+1", changeType: "positive" },
                    { name: "Active Now", stat: String(staff.filter((m: any) => m.status === 'active').length), change: "100%", changeType: "positive" },
                    { name: "Managers", stat: String(staff.filter((m: any) => m.role === 'ADMIN').length), change: "0%", changeType: "positive" },
                    { name: "Cashiers", stat: String(staff.filter((m: any) => m.role === 'CASHIER').length), change: "+2", changeType: "positive" },
                ]} />
            </div>

            <StaffFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                roleFilter={roleFilter}
                onRoleChange={setRoleFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
            />

            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[4px] animate-pulse leading-none">Syncing Workforce...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <StaffTable
                        staff={paginatedStaff}
                        onToggleStatus={handleToggleStatus}
                        onEdit={(member) => {
                            setSelectedStaffToEdit(member);
                            setIsModalOpen(true);
                        }}
                        onViewDetails={(member) => navigate(`/store-admin/staff/${member.id}`)}
                    />

                    <StaffPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCount={totalCount}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
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
