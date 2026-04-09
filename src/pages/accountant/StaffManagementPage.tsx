import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  UserCheck,
  Tag,
} from 'lucide-react';
import api from '../../api/api';
import StaffForm, { type StaffFormData } from '../../components/accountant/StaffForm';

// Types
type StaffStatus = 'ACTIVE' | 'INACTIVE';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  status: StaffStatus;
  joiningDate: string;
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('PKR', 'Rs').trim();
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

// Main Staff Management Page
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
      // Pass status=all to include inactive staff
      const response = await api.get('/staff', {
        params: { status: 'all' },
      });
      console.log('🔍 Staff API response:', response);
      
      // Backend returns { success, data: { items: [...], pagination: {...} }, message }
      // api.get returns response.data which is the above object
      let staffList: StaffMember[] = [];
      
      if (response?.data?.items && Array.isArray(response.data.items)) {
        staffList = response.data.items;
      } else if (response?.data?.data?.items && Array.isArray(response.data.data.items)) {
        staffList = response.data.data.items;
      } else if (Array.isArray(response?.data?.data)) {
        staffList = response.data.data;
      } else if (Array.isArray(response?.data)) {
        staffList = response.data;
      } else if (Array.isArray(response)) {
        staffList = response;
      }

      console.log('✅ Staff list extracted:', staffList.length, 'items');
      setStaff(staffList);
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
      setError(err.response?.data?.message || 'Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Add/Update staff
  const handleSaveStaff = async (formData: StaffFormData) => {
    setIsSubmitting(true);
    try {
      // Combine first and last name for backend
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Map new form fields to backend API
      const backendData = {
        name: fullName,
        role: formData.role,
        monthlySalary: Number(formData.basicSalary),
        joiningDate: formData.joinDate,
        phone: formData.mobile,
        status: formData.status,
      };

      if (selectedStaff) {
        // Update existing staff
        await api.patch(`/staff/${selectedStaff.id}`, backendData);
      } else {
        // Create new staff
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

  // Delete staff
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

  // Filter staff
  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || member.status === statusFilter;
    const matchesRole =
      roleFilter === 'ALL' || member.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Calculate total monthly salary
  const totalMonthlySalary = staff.reduce(
    (sum, member) => sum + Number(member.monthlySalary || 0),
    0
  );

  const activeCount = staff.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = staff.filter((s) => s.status === 'INACTIVE').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/accountant')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <Users className="text-blue-600" size={28} />
                  Staff Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage staff information, roles, and salaries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingStaffData(null);
                  setSelectedStaff(null);
                  setShowStaffForm(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <Plus size={18} />
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-xs underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Total Staff</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{staff.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Active</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Monthly Payroll</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlySalary)}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | StaffStatus)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-slate-500" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                {STAFF_ROLES.map((role) => (
                  <option key={role} value={role}>{formatRole(role)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="text-blue-600 animate-spin mb-3" />
              <p className="text-slate-500 font-medium">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="text-slate-400" size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL' ? 'No matching staff' : 'No staff found'}
              </h3>
              <p className="text-slate-500 text-sm mb-4">
                {searchQuery || statusFilter !== 'ALL' || roleFilter !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Add your first staff member to get started'}
              </p>
              {!searchQuery && statusFilter === 'ALL' && roleFilter === 'ALL' && (
                <button
                  onClick={() => {
                    setEditingStaffData(null);
                    setSelectedStaff(null);
                    setShowStaffForm(true);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Staff
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Monthly Salary
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">
                        Joining Date
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStaff.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{formatRole(member.role)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700">
                            {formatCurrency(member.monthlySalary)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              member.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {member.status === 'ACTIVE' ? (
                              <CheckCircle2 size={12} className="mr-1" />
                            ) : (
                              <X size={12} className="mr-1" />
                            )}
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">
                            {formatDate(member.joiningDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                // Convert existing staff data to StaffFormData format
                                const nameParts = member.name.split(' ');
                                setEditingStaffData({
                                  firstName: nameParts[0] || '',
                                  lastName: nameParts.slice(1).join(' ') || '',
                                  fatherName: '', // Backend doesn't store this yet
                                  cnic: '', // Backend doesn't store this yet
                                  email: '', // Backend doesn't store this yet
                                  mobile: member.phone || '', // Map phone from backend
                                  role: member.role,
                                  maritalStatus: 'SINGLE', // Backend doesn't store this yet
                                  dob: '', // Backend doesn't store this yet
                                  joinDate: member.joiningDate.split('T')[0],
                                  address: '', // Backend doesn't store this yet
                                  basicSalary: String(member.monthlySalary),
                                  salaryType: 'PER_MONTH',
                                  joiningType: 'FULL_TIME',
                                  status: member.status,
                                });
                                setShowStaffForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Showing {filteredStaff.length} of {staff.length} staff members
                  </span>
                  <span>
                    Total Monthly: <strong className="text-slate-800">{formatCurrency(
                      filteredStaff.reduce((sum, m) => sum + Number(m.monthlySalary || 0), 0)
                    )}</strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Staff Form Modal */}
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
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Staff Member</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-slate-700 mb-6">
              Are you sure you want to remove <strong>{selectedStaff.name}</strong> from the system?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
