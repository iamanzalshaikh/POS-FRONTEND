import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import StaffHeader from '@/components/store-admin/StaffHeader';
import StaffFilters from '@/components/store-admin/StaffFilters';
import StaffTable from '@/components/store-admin/StaffTable';
import StaffPagination from '@/components/store-admin/StaffPagination';
import AddStaffModal from '@/components/store-admin/AddStaffModal';
import StatsCards from '@/components/global-components/StatsCards';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<StaffMember | undefined>(undefined);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<StaffStatus | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const { users, isLoading, fetchUsers, createUser, updateUser, toggleUserStatus } = useUserStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const staff: StaffMember[] = users.map(mapApiUser);

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
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 transition-colors duration-500 flex text-slate-900 dark:text-slate-100">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="p-4 md:p-8 lg:p-10 w-full animate-fade-in space-y-10">
                    <StaffHeader
                        onAddStaff={() => setIsModalOpen(true)}
                        onExport={() => alert('Export CSV feature coming soon!')}
                        onRefresh={() => fetchUsers()}
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

                    {isLoading ? (
                        <div className="bg-white rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] animate-pulse">Syncing Workforce...</p>
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
                                itemsPerPage={5}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </main>
            </div>

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
