import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Eye,
  Edit2,
} from 'lucide-react';
import {
  getPayroll,
  updatePayroll,
  getStaffPayrollHistory,
  getStaff,
  type PayrollRecord,
  type PayrollStatus,
  type StaffMember,
  type UpdatePayrollData,
} from '../../api/staff.api';
import Toast, { type ToastType } from '../../components/ui/Toast';
import ProcessSalaryForm from '../../components/accountant/ProcessSalaryForm';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('PKR', 'Rs').trim();
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const STATUS_CONFIG: Record<PayrollStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  PAID: { color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle2 size={12} />, label: 'Paid' },
  UNPAID: { color: 'text-rose-700', bg: 'bg-rose-100', icon: <XCircle size={12} />, label: 'Unpaid' },
  PARTIAL: { color: 'text-amber-700', bg: 'bg-amber-100', icon: <AlertCircle size={12} />, label: 'Partial' },
};

const PayrollManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PayrollStatus>('ALL');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [viewingStaffId, setViewingStaffId] = useState<string | null>(null);
  const [staffHistory, setStaffHistory] = useState<PayrollRecord[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    notes: '',
  });

  useEffect(() => {
    fetchPayroll();
    fetchStaff();
  }, [page, searchQuery, statusFilter, monthFilter, yearFilter]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (monthFilter) params.month = parseInt(monthFilter);
      if (yearFilter) params.year = parseInt(yearFilter);

      const response = await getPayroll(params);
      if (response.success) {
        setPayrollRecords(response.data.items);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error: any) {
      showToast('Failed to fetch payroll records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await getStaff({ limit: 100 });
      if (response.success) {
        setStaffList(response.data.items);
      }
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayroll) return;

    try {
      const data: UpdatePayrollData = {
        amountPaid: paymentForm.amountPaid,
        notes: paymentForm.notes !== selectedPayroll.notes ? paymentForm.notes : undefined,
      };

      const response = await updatePayroll(selectedPayroll.id, data);
      if (response.success) {
        showToast('Payment updated successfully', 'success');
        setShowPaymentModal(false);
        setSelectedPayroll(null);
        await fetchPayroll();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update payment';
      showToast(message, 'error');
    }
  };

  const openPaymentModal = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setPaymentForm({
      amountPaid: record.amountPaid,
      notes: record.notes || '',
    });
    setShowPaymentModal(true);
  };

  const viewStaffHistory = async (staffId: string) => {
    try {
      setViewingStaffId(staffId);
      const response = await getStaffPayrollHistory(staffId);
      if (response.success) {
        setStaffHistory(response.data.records);
        setShowHistoryModal(true);
      }
    } catch (error: any) {
      showToast('Failed to fetch payroll history', 'error');
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const totalPaid = payrollRecords.reduce((sum, r) => sum + r.amountPaid, 0);
  const totalSalary = payrollRecords.reduce((sum, r) => sum + r.salary, 0);
  const totalPending = totalSalary - totalPaid;

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
                  <DollarSign className="text-blue-600" size={28} />
                  Payroll Management
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage staff salaries and payments
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <Plus size={18} />
              Add Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Toast */}
        {toast && (
          <div className="mb-6 z-[100]">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Total Salary</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalary)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by staff name..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | PayrollStatus)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={32} className="text-blue-600 animate-spin mb-3" />
              <p className="text-slate-500 font-medium">Loading payroll records...</p>
            </div>
          ) : payrollRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="text-slate-400" size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No payroll records</h3>
              <p className="text-slate-500 text-sm mb-4">Create your first payroll record to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                Add Payroll
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Staff</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Salary</th>
                      <th className="px-6 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {payrollRecords.map((record) => {
                      const balance = record.salary - record.amountPaid;
                      const status = STATUS_CONFIG[record.status];
                      return (
                        <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                {record.staff?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800">{record.staff?.name || 'Unknown'}</span>
                                <p className="text-xs text-slate-500">{record.staff?.role || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700">{MONTHS[record.month - 1]} {record.year}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-slate-700">{formatCurrency(record.salary)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-emerald-600">{formatCurrency(record.amountPaid)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-semibold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => viewStaffHistory(record.staffId)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View History"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => openPaymentModal(record)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Update Payment"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Showing {payrollRecords.length} of {totalRecords} records</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Process Salary Modal - Replaces old create modal */}
      <ProcessSalaryForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPayroll();
          showToast('Salary processed successfully!', 'success');
        }}
      />

      {/* Update Payment Modal */}
      {showPaymentModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Update Payment</h2>
            <p className="text-sm text-slate-500 mb-6">
              {selectedPayroll.staff?.name} - {MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}
            </p>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Salary</span>
                  <span className="font-semibold">{formatCurrency(selectedPayroll.salary)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Currently Paid</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(selectedPayroll.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Remaining</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(selectedPayroll.salary - selectedPayroll.amountPaid)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount Paid *</label>
                <input
                  type="number"
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })}
                  min="0"
                  max={selectedPayroll.salary}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePayment}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Payroll History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Payroll History</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XCircle size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {staffHistory.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No payroll records found</p>
              ) : (
                <div className="space-y-3">
                  {staffHistory.map((record) => {
                    const status = STATUS_CONFIG[record.status];
                    return (
                      <div key={record.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">
                            {MONTHS[record.month - 1]} {record.year}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Salary:</span>
                            <span className="ml-2 font-medium">{formatCurrency(record.salary)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Paid:</span>
                            <span className="ml-2 font-medium text-emerald-600">{formatCurrency(record.amountPaid)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Balance:</span>
                            <span className="ml-2 font-medium text-amber-600">{formatCurrency(record.salary - record.amountPaid)}</span>
                          </div>
                        </div>
                        {record.notes && (
                          <p className="text-xs text-slate-500 mt-2">Notes: {record.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagementPage;
