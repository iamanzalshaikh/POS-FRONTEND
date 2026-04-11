import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Edit2,
  XCircle,
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
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

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
  PAID: { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50', icon: <CheckCircle2 size={12} />, label: 'Paid' },
  UNPAID: { color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50', icon: <XCircle size={12} />, label: 'Unpaid' },
  PARTIAL: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50', icon: <AlertCircle size={12} />, label: 'Partial' },
};

const PayrollManagementPage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PayrollStatus>('ALL');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
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
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error: any) {
      showToast('Failed to fetch payroll records', 'error');
    } finally {
      setLoading(false);
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
      showToast(error.response?.data?.message || 'Failed to update payment', 'error');
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

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      header: "Staff Member",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700">
            {row.original.staff?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.staff?.name || 'Unknown'}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">{row.original.staff?.role || ''}</p>
          </div>
        </div>
      )
    },
    {
      header: "Period",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
            {MONTHS[row.original.month - 1]} {row.original.year}
          </span>
        </div>
      )
    },
    {
      header: "Salary",
      cell: ({ row }) => (
        <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrency(row.original.salary)}
        </div>
      )
    },
    {
      header: "Paid",
      cell: ({ row }) => (
        <div className="text-center text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrency(row.original.amountPaid)}
        </div>
      )
    },
    {
      header: "Balance",
      cell: ({ row }) => {
        const balance = row.original.salary - row.original.amountPaid;
        return (
          <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
            {formatCurrency(balance)}
          </div>
        )
      }
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status];
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${config.bg} ${config.color}`}>
              {config.icon}
              {config.label}
            </span>
          </div>
        )
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => viewStaffHistory(row.original.staffId)}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            title="History"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openPaymentModal(row.original)}
            className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all active:scale-95 border border-emerald-100 dark:border-emerald-900/50"
            title="Update"
          >
            <Edit2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Payroll Management"
        description="Manage staff salaries and payments"
        primaryAction={{
          label: "Add Payroll",
          icon: Plus,
          onClick: () => setShowCreateModal(true)
        }}
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-4">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Salary"
          value={formatCurrency(totalSalary)}
          icon={DollarSign}
          colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
        <MetricCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Total Pending"
          value={formatCurrency(totalPending)}
          icon={AlertCircle}
          colorClass="bg-slate-900 text-white dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={payrollRecords}
          isLoading={loading}
          onRefresh={fetchPayroll}
          placeholder="Search staff members..."
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
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | PayrollStatus)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="UNPAID">Unpaid</option>
              </select>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[140px]"
              >
                <option value="">All Months</option>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          }
        />
      </div>

      <ProcessSalaryForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchPayroll();
          showToast('Salary processed successfully!', 'success');
        }}
      />

      {/* Update Payment Modal */}
      {showPaymentModal && selectedPayroll && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div 
             className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
             onClick={() => setShowPaymentModal(false)}
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <DollarSign size={28} className="text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Update Payment</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  {selectedPayroll.staff?.name} <span className="mx-2 opacity-30">|</span> {MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Salary</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{formatCurrency(selectedPayroll.salary)}</p>
                </div>
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Previously Paid</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{formatCurrency(selectedPayroll.amountPaid)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest ml-1">Payment Amount (PKR) *</label>
                <input
                  type="number"
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })}
                  min="0"
                  max={selectedPayroll.salary}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[14px] font-black text-blue-600 dark:text-blue-400 tabular-nums focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-[#64748b] uppercase tracking-widest ml-1">Internal Audit Notes</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional registry metadata..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95"
              >
                Abort
              </button>
              <button
                onClick={handleUpdatePayment}
                className="flex-[1.5] py-4 bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
              >
                Confirm Disbursement
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* History Modal */}
      {showHistoryModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          <div 
             className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
             onClick={() => setShowHistoryModal(false)}
          />
          <div className="relative z-10 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Financial History</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Staff Remuneration Track Record</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 active:scale-95"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {staffHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <DollarSign size={48} className="text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Registry Null</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {staffHistory.map((record) => {
                    const status = STATUS_CONFIG[record.status];
                    return (
                      <div key={record.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border-2 border-slate-100 dark:border-slate-800 group hover:border-blue-500/20 transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                            {MONTHS[record.month - 1]} {record.year}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${status.bg} ${status.color} shadow-sm`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Entitlement</p>
                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{formatCurrency(record.salary)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1.5">Fulfilled</p>
                            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{formatCurrency(record.amountPaid)}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1.5">Outstanding</p>
                            <p className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{formatCurrency(record.salary - record.amountPaid)}</p>
                          </div>
                        </div>
                        {record.notes && (
                          <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">" {record.notes} "</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-10 py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-4 bg-slate-950 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-900 transition-all active:scale-95 shadow-xl shadow-slate-900/10 border-b-4 border-black"
              >
                Close History
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PayrollManagementPage;
