import { useEffect, useState } from 'react';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import StaffHeader from '@/components/store-admin/StaffHeader';
import StaffFilters from '@/components/store-admin/StaffFilters';
import StaffTable from '@/components/store-admin/StaffTable';
import StaffPagination from '@/components/store-admin/StaffPagination';
import AddStaffModal from '@/components/store-admin/AddStaffModal';
import type { StaffMember, CreateStaffInput, StaffRole, StaffStatus } from './types/staff.types';
import { fetchStaffMembers, createStaffMember, updateStaffMember } from '@/api/staff.api';

function formatActivity(value?: string | null): string {
    return value ? new Date(value).toLocaleString() : 'Never';
}

function mapApiUser(u: { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string | null; lastLogoutAt?: string | null }): StaffMember {
    return {
        id: u.id,
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<StaffMember | undefined>(undefined);

    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState<StaffStatus | 'All'>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchStaffMembers()
            .then((response) => {
                if (cancelled) return;
                const resData = response.data as { data?: unknown } | unknown[];
                const users = Array.isArray(resData) ? resData : (resData && typeof resData === 'object' && 'data' in resData ? (resData as { data: unknown[] }).data : []);
                if (Array.isArray(users)) {
                    setStaff(users.map((u) => mapApiUser(u as { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string | null; lastLogoutAt?: string | null })));
                } else {
                    setStaff([]);
                }
            })
            .catch((err) => {
                if (!cancelled) setStaff([]);
                console.warn("Staff API failed", err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

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
            const response = await createStaffMember(data);
            const resData = response.data as { success?: boolean; data?: unknown };
            const user = (resData?.data ?? resData) as { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string | null; lastLogoutAt?: string | null };
            if (user?.id) {
                setStaff(prev => [mapApiUser(user), ...prev]);
                return { success: true };
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : null;
            console.warn("Create staff failed", err);
            return { success: false, error: msg || 'Failed to create staff' };
        }
    };

    const handleToggleStatus = async (id: string, active: boolean) => {
        try {
            // Optimistic update for punchy feel
            setStaff(prev => prev.map(s => s.id === id ? { ...s, status: active ? 'active' : 'inactive' } : s));
            await updateStaffMember(id, { isActive: active });
        } catch (err) {
            console.warn("Toggle status failed", err);
            // Rollback
            setStaff(prev => prev.map(s => s.id === id ? { ...s, status: !active ? 'active' : 'inactive' } : s));
        }
    };

    const handleEditStaff = async (id: string, data: any): Promise<{ success: boolean; error?: string }> => {
        try {
            await updateStaffMember(id, data);
            setStaff(prev => prev.map(s => s.id === id ? { 
                ...s, 
                ...data, 
                status: data.isActive !== undefined ? (data.isActive ? 'active' : 'inactive') : s.status 
            } : s));
            return { success: true };
        } catch (err) {
            console.warn("Edit staff failed", err);
            return { success: false, error: 'Failed to update user details' };
        }
    };



    return (
        <div className="min-h-screen bg-[#F7F9FC] transition-colors duration-500 flex text-slate-900">
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
                    />

                    <StaffFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        roleFilter={roleFilter}
                        onRoleChange={setRoleFilter}
                        statusFilter={statusFilter}
                        onStatusChange={setStatusFilter}
                    />

                    {loading ? (
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
