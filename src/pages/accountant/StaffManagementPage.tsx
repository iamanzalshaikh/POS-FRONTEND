import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import api from '../../api/api';
import StaffForm, { type StaffFormData } from '../../components/accountant/StaffForm';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

// Types
type StaffStatus = 'ACTIVE' | 'INACTIVE';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  status: StaffStatus;
  joiningDate: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Valid staff roles
const STAFF_ROLES = [
  'CASHIER',
  'MANAGER',
  'SUPERVISOR',
  'ACCOUNTANT',
  'SALES_ASSOCIATE',
  'INVENTORY_CLERK',
  'SECURITY',
  'CLEANER',
  'DRIVER',
  'OTHER',
];

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(amount)
    .replace('PKR', 'Rs')
    .trim();
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format role for display
const formatRole = (role: string): string => {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const StaffManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch staff
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/staff', {
        params: { status: 'all' },
      });
      
      let staffList: StaffMember[] = [];
      if (response?.data?.items && Array.isArray(response.data.items)) {
        staffList = response.data.items;
      } else if (response?.data?.data?.items && Array.isArray(response.data.data.items)) {
        staffList = response.data.data.items;
      } else if (Array.isArray(response?.data?.data)) {
        staffList = response.data.data;
      } else if (Array.isArray(response?.data)) {
        staffList = response.data;
      }

      setStaff(staffList);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSaveStaff = async (formData: StaffFormData) => {
    setIsSubmitting(true);
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const backendData = {
        name: fullName,
        role: formData.role,
        monthlySalary: Number(formData.basicSalary),
        joiningDate: formData.joinDate,
        phone: formData.mobile,
        status: formData.status,
      };

      if (selectedStaff) {
        await api.patch(`/staff/${selectedStaff.id}`, backendData);
      } else {
        await api.post('/staff', backendData);
      }
      
      setShowStaffForm(false);
      setEditingStaffData(null);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save staff member';
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setIsDeleting(true);
    try {
      await api.delete(`/staff/${selectedStaff.id}`);
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || member.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalMonthlySalary = staff.reduce((sum, member) => sum + Number(member.monthlySalary || 0), 0);
  const activeCount = staff.filter((s) => s.status === 'ACTIVE').length;

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
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700">
            {row.original.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">Joined {formatDate(row.original.joiningDate)}</p>
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
      header: "Monthly Salary",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrency(row.original.monthlySalary)}
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => {
              setSelectedStaff(row.original);
              const nameParts = row.original.name.split(' ');
              setEditingStaffData({
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                fatherName: '',
                cnic: '',
                email: '',
                mobile: row.original.phone || '',
                role: row.original.role,
                maritalStatus: 'SINGLE',
                dob: '',
                joinDate: row.original.joiningDate.split('T')[0],
                address: '',
                basicSalary: String(row.original.monthlySalary),
                joiningType: 'FULL_TIME',
                status: row.original.status,
              });
              setShowStaffForm(true);
            }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedStaff(row.original);
              setShowDeleteModal(true);
            }}
            className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-95 border border-rose-100 dark:border-rose-900/50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Staff Management"
        description="Manage staff information, roles, and salaries"
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
          value={String(staff.length)}
          icon={Users}
          colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
        <MetricCard
          title="Active Staff"
          value={String(activeCount)}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Monthly Payroll"
          value={formatCurrency(totalMonthlySalary)}
          icon={DollarSign}
          colorClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={filteredStaff}
          isLoading={loading}
          onRefresh={fetchStaff}
          placeholder="Search staff members..."
          hidePagination={false}
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name..."
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
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
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
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Terminate Account</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70 mt-4 leading-relaxed">
                You are about to purge <strong className="text-slate-900 dark:text-white">{selectedStaff.name}</strong> from the system registry. This operation is irreversible.
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
                Abort
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="flex-[1.5] px-4 py-4 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-700 transition-all disabled:bg-slate-400 flex items-center justify-center gap-2 shadow-xl shadow-rose-500/20 active:scale-95 border-b-4 border-rose-800"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Confirm Purge
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
