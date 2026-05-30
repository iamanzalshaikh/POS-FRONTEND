import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Eye
} from 'lucide-react';
import { 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff, 
  getStaffSummary,
  type StaffMember,
  type StaffStatus
} from '../../api/staff.api';
import StaffForm, { type StaffFormData } from '../../components/accountant/StaffForm';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from '@/lib/toast';
import { ManagementPageSkeleton } from '@/components/ui/skeletons/ManagementPageSkeleton';

// Valid staff roles
const STAFF_ROLES = [
  'MANAGER',
  'SUPERVISOR',
  'CASHIER',
  'SALES_ASSOCIATE',
  'ACCOUNTANT',
  'INVENTORY_CLERK',
  'SECURITY',
  'CLEANER',
  'DRIVER',
  'OTHER',
];

// Utility functions
const formatAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
};

const formatCurrency = (amount: number | string): string => {
  return `Rs ${formatAmount(amount)}`;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format role for display
const formatRole = (role: string): string => {
  if (!role) return 'N/A';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StaffStatus>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStaffData, setEditingStaffData] = useState<StaffFormData | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Queries
  const { data: staffRes, isLoading: staffLoading, refetch: refetchStaff } = useQuery({
    queryKey: ['accountant-staff-list', statusFilter, roleFilter, debouncedSearch],
    queryFn: () => getStaff({ 
      status: statusFilter === 'ALL' ? 'all' : statusFilter,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      search: debouncedSearch || undefined
    }),
    staleTime: 1000 * 60 * 10,
  });

  const { data: summaryRes, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['accountant-staff-summary'],
    queryFn: () => getStaffSummary(),
    staleTime: 1000 * 60 * 10,
  });

  const staff = staffRes?.success ? staffRes.data.items : [];
  const summary = summaryRes?.success ? summaryRes.data : { totalStaff: 0, activeStaff: 0, totalMonthlySalary: 0 };
  const loading = staffLoading || summaryLoading;
  
  const refetchData = useCallback(() => {
    refetchStaff();
    refetchSummary();
  }, [refetchStaff, refetchSummary]);

  const handleSaveStaff = async (formData: StaffFormData) => {
    setIsSubmitting(true);
    try {
      const backendData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fatherHusbandName: formData.fatherName,
        cnic: formData.cnic,
        email: formData.email || undefined,
        phone: formData.mobile,
        role: formData.role,
        roleTitle: formatRole(formData.role),
        dateOfBirth: formData.dob,
        joiningDate: formData.joinDate,
        address: formData.address || undefined,
        baseSalary: Number(formData.basicSalary),
        status: formData.status,
      };

      if (selectedStaff) {
        await updateStaff(selectedStaff.id, backendData);
        toast.success('Staff member updated successfully');
      } else {
        await createStaff(backendData);
        toast.success('New staff member registered successfully');
      }
      
      setShowStaffForm(false);
      setEditingStaffData(null);
      setSelectedStaff(null);
      refetchData();
    } catch (err: unknown) {
      const error = err as any;
      const message = error.response?.data?.message || 'Failed to sync staff record with registry';
      if (!message.toLowerCase().includes('cnic')) {
        toast.error(message);
      }
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setIsDeleting(true);
    try {
      await deleteStaff(selectedStaff.id);
      toast.success('Staff member deactivated successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      refetchData();
    } catch (err: unknown) {
      const error = err as any;
      toast.error(error.response?.data?.message || 'Termination sequence failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<StaffMember>[] = [
    {
      header: "Staff ID",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.displayId || `#${row.original.id.slice(-6).toUpperCase()}`}
        </div>
      )
    },
    {
      header: "Staff Member",
      cell: ({ row }) => (
        <div 
          className="flex items-center justify-center gap-3 cursor-pointer group/name"
          onClick={() => navigate(`/accountant/staff/${row.original.id}`)}
        >
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover/name:text-indigo-600 transition-colors">{row.original.name}</p>
          </div>
        </div>
      )
    },
    {
      header: "Role",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
            {formatRole(row.original.role)}
          </span>
        </div>
      )
    },
    {
      header: "Base Salary",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatAmount(row.original.baseSalary || row.original.monthlySalary)}
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
            row.original.status === 'ACTIVE' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50' 
              : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${row.original.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {row.original.status}
          </span>
        </div>
      )
    },
    {
      header: "Joined On",
      cell: ({ row }) => (
        <div className="text-center text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest tabular-nums">
          {formatDate(row.original.joiningDate)}
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {/* View / Insight Button */}
          <button 
            onClick={() => navigate(`/accountant/staff/${row.original.id}`)}
            className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-100 dark:border-indigo-900/50 transition-all active:scale-95 group"
            title="Insight Report"
          >
            <Eye size={16} className="group-hover:scale-110 transition-transform" />
          </button>

          {/* Edit Button */}
          <button 
            onClick={() => {
              setSelectedStaff(row.original);
              setEditingStaffData({
                firstName: row.original.firstName || row.original.name.split(' ')[0] || '',
                lastName: row.original.lastName || row.original.name.split(' ').slice(1).join(' ') || '',
                fatherName: row.original.fatherHusbandName || '',
                cnic: row.original.cnic || '',
                email: row.original.email || '',
                mobile: row.original.phone || '',
                role: row.original.role,
                maritalStatus: 'SINGLE',
                dob: row.original.dateOfBirth ? row.original.dateOfBirth.split('T')[0] : '',
                joinDate: row.original.joiningDate.split('T')[0],
                address: row.original.address || '',
                basicSalary: String(row.original.baseSalary || row.original.monthlySalary),
                joiningType: 'FULL_TIME',
                status: row.original.status,
              });
              setShowStaffForm(true);
            }}
            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-all active:scale-95 group"
            title="Modify Record"
          >
            <Edit2 size={16} className="group-hover:rotate-12 transition-transform" />
          </button>

          {/* Delete Button */}
          <button 
            onClick={() => {
              setSelectedStaff(row.original);
              setShowDeleteModal(true);
            }}
            className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl border border-rose-100 dark:border-rose-900/50 transition-all active:scale-95 group"
            title="Deactivate"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <ManagementPageSkeleton cards={3} columns={7} />;

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Staff List"
        description="Manage your employees, their roles, and basic salary details"
        primaryAction={{
          label: "Add Staff Member",
          icon: Plus,
          onClick: () => {
            setEditingStaffData(null);
            setSelectedStaff(null);
            setShowStaffForm(true);
          }
        }}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4">
          <AlertCircle className="text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-500 text-[10px] font-black uppercase underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Staff"
          value={String(summary.totalStaff)}
          icon={Users}
          colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
        <MetricCard
          title="Active Staff"
          value={String(summary.activeStaff)}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Monthly Salary Total"
          value={formatCurrency(summary.totalMonthlySalary)}
          icon={DollarSign}
          colorClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10 border border-slate-100 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={staff}
          isLoading={loading}
          onRefresh={refetchData}
          placeholder="Search staff..."
          hidePagination={false}
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[240px]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | StaffStatus)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Staff</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
              >
                <option value="ALL">All Roles</option>
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>{formatRole(role)}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>

      <StaffForm
        isOpen={showStaffForm}
        onClose={() => {
          setShowStaffForm(false);
          setEditingStaffData(null);
          setSelectedStaff(null);
        }}
        onSubmit={handleSaveStaff}
        initialData={editingStaffData}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div 
             className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
             onClick={() => {
               if (!isDeleting) {
                 setShowDeleteModal(false);
                 setSelectedStaff(null);
               }
             }}
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-900/50">
                <AlertCircle size={32} className="text-rose-600 dark:text-rose-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Deactivate Staff</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70 mt-4 leading-relaxed">
                You are about to deactivate <strong className="text-slate-900 dark:text-white">{selectedStaff.name}</strong>. Their profile will be marked as INACTIVE.
              </p>
            </div>
            <div className="flex gap-3 mt-10">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="flex-[1.5] px-4 py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-700 transition-all disabled:bg-slate-400 flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 active:scale-95 border-b-4 border-rose-800"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Confirm Inactive
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffManagementPage;
