import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, DollarSign, Calendar, FileText, Calculator, CheckCircle2, Loader2, AlertCircle, User } from 'lucide-react';
import api from '../../api/api';

// ============================================================================
// TYPES
// ============================================================================

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  status: string;
  phone?: string | null;
  joiningDate: string;
}

export interface ProcessSalaryFormData {
  staffId: string;
  month: number;
  year: number;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  bonus: string;
  deductions: string;
}

export interface ProcessSalaryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

const EMPTY_FORM: ProcessSalaryFormData = {
  staffId: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  paymentDate: new Date().toISOString().split('T')[0],
  referenceNumber: '',
  notes: '',
  bonus: '',
  deductions: '',
};

// ============================================================================
// STABLE SUB-COMPONENTS
// ============================================================================

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}

const TextField = React.memo(function TextField({
  label,
  value,
  onChange,
  required,
  error,
  icon: Icon,
  placeholder,
  type = 'text',
  readOnly = false,
}: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'border-slate-300'
          } ${error ? 'border-red-300 bg-red-50' : ''}`}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
});

interface SelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  placeholder?: string;
}

const SelectField = React.memo(function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  icon: Icon,
  placeholder,
}: SelectProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white ${
            error ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProcessSalaryForm: React.FC<ProcessSalaryFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Form state
  const [formData, setFormData] = useState<ProcessSalaryFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProcessSalaryFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Staff list
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Selected staff info
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Duplicate check state
  const [existingPayroll, setExistingPayroll] = useState<{ id: string; amountPaid: number; status: string } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Fetch staff on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchStaff = async () => {
      setLoadingStaff(true);
      try {
        const response = await api.get('/staff', { params: { status: 'all', limit: 200 } });
        let items: StaffMember[] = [];
        
        if (response?.data?.data?.items) {
          items = response.data.data.items.map((s: any) => ({
            ...s,
            monthlySalary: Number(s.monthlySalary),
          }));
        } else if (response?.data?.items) {
          items = response.data.items.map((s: any) => ({
            ...s,
            monthlySalary: Number(s.monthlySalary),
          }));
        } else if (Array.isArray(response?.data?.data)) {
          items = response.data.data.map((s: any) => ({
            ...s,
            monthlySalary: Number(s.monthlySalary),
          }));
        } else if (Array.isArray(response?.data)) {
          items = response.data.map((s: any) => ({
            ...s,
            monthlySalary: Number(s.monthlySalary),
          }));
        }

        setStaffList(items);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaff();
  }, [isOpen]);

  // Reset form on open/close
  useEffect(() => {
    if (!isOpen) return;
    setFormData({ ...EMPTY_FORM });
    setErrors({});
    setSelectedStaff(null);
  }, [isOpen]);

  // Update selected staff when staffId changes
  useEffect(() => {
    if (!formData.staffId) {
      setSelectedStaff(null);
      setExistingPayroll(null);
      return;
    }
    const staff = staffList.find((s) => s.id === formData.staffId);
    setSelectedStaff(staff || null);
  }, [formData.staffId, staffList]);

  // Check for existing payroll when staff/month/year changes
  useEffect(() => {
    if (!formData.staffId || !formData.month || !formData.year) {
      setExistingPayroll(null);
      return;
    }

    const checkExistingPayroll = async () => {
      setCheckingDuplicate(true);
      try {
        const response = await api.get('/staff/payroll', {
          params: {
            staffId: formData.staffId,
            month: formData.month,
            year: formData.year,
          },
        });

        const items = response?.data?.data?.items || response?.data?.data || [];
        if (items.length > 0) {
          setExistingPayroll({
            id: items[0].id,
            amountPaid: Number(items[0].amountPaid),
            status: items[0].status,
          });
        } else {
          setExistingPayroll(null);
        }
      } catch (err) {
        // Don't block submission if check fails
        console.warn('Failed to check existing payroll:', err);
        setExistingPayroll(null);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    checkExistingPayroll();
  }, [formData.staffId, formData.month, formData.year]);

  // Calculated values
  const calculations = useMemo(() => {
    const baseSalary = selectedStaff?.monthlySalary || 0;
    const bonus = Number(formData.bonus) || 0;
    const deductions = Number(formData.deductions) || 0;
    const grossSalary = baseSalary + bonus;
    const netSalary = grossSalary - deductions;

    return {
      baseSalary,
      bonus,
      deductions,
      grossSalary,
      netSalary,
    };
  }, [selectedStaff?.monthlySalary, formData.bonus, formData.deductions]);

  // Field update callbacks
  const updateStaffId = useCallback((v: string) => setFormData((p) => ({ ...p, staffId: v })), []);
  const updateMonth = useCallback((v: string) => setFormData((p) => ({ ...p, month: Number(v) || p.month })), []);
  const updateYear = useCallback((v: string) => setFormData((p) => ({ ...p, year: Number(v) || p.year })), []);
  const updatePaymentDate = useCallback((v: string) => setFormData((p) => ({ ...p, paymentDate: v })), []);
  const updateReferenceNumber = useCallback((v: string) => setFormData((p) => ({ ...p, referenceNumber: v })), []);
  const updateNotes = useCallback((v: string) => setFormData((p) => ({ ...p, notes: v })), []);
  const updateBonus = useCallback((v: string) => setFormData((p) => ({ ...p, bonus: v })), []);
  const updateDeductions = useCallback((v: string) => setFormData((p) => ({ ...p, deductions: v })), []);

  // Validation
  const validate = useCallback(() => {
    const e: Partial<Record<keyof ProcessSalaryFormData, string>> = {};

    if (!formData.staffId) e.staffId = 'Please select a staff member';
    if (!formData.month || formData.month < 1 || formData.month > 12) e.month = 'Valid month is required';
    if (!formData.year || formData.year < 2000 || formData.year > 2100) e.year = 'Valid year is required';
    if (!formData.paymentDate) e.paymentDate = 'Payment date is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Build payload matching backend API
      const payload = {
        staffId: formData.staffId,
        month: formData.month,
        year: formData.year,
        salary: calculations.baseSalary, // Snap salary from staff record
        amountPaid: calculations.netSalary, // Net amount being paid
        paymentDate: formData.paymentDate,
        notes: formData.notes || undefined,
      };

      await api.post('/staff/payroll', payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Failed to process salary';
      
      if (status === 409) {
        alert(
          `Payroll record already exists for this staff member in the selected month/year.\n\n` +
          `To update an existing payroll, please use the "Update Payment" button in the payroll list.\n\n` +
          `Details: ${message}`
        );
      } else {
        alert(`Error: ${message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, calculations, onSuccess, onClose]);

  // Close handler
  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  // Don't render if closed
  if (!isOpen) return null;

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    yearOptions.push({ value: y, label: String(y) });
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <DollarSign className="text-blue-600" size={24} />
            Process Salary Payment
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Staff Selection */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={16} />
                Staff Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Staff Member"
                  value={formData.staffId}
                  onChange={updateStaffId}
                  options={staffList.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.role}) - Rs.${Number(s.monthlySalary).toLocaleString()}`,
                  }))}
                  required
                  error={errors.staffId}
                  icon={User}
                  placeholder="Select staff member"
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Base Salary (Rs)
                  </label>
                  <div className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold">
                    {calculations.baseSalary > 0 ? `Rs. ${calculations.baseSalary.toLocaleString()}` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Period & Payment Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calendar size={16} />
                Payment Period & Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SelectField
                  label="Month"
                  value={String(formData.month)}
                  onChange={updateMonth}
                  options={MONTHS}
                  required
                  error={errors.month}
                  icon={Calendar}
                  placeholder="Select month"
                />
                <SelectField
                  label="Year"
                  value={String(formData.year)}
                  onChange={updateYear}
                  options={yearOptions}
                  required
                  error={errors.year}
                  icon={Calendar}
                  placeholder="Select year"
                />
                <TextField
                  label="Payment Date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={updatePaymentDate}
                  required
                  error={errors.paymentDate}
                  icon={Calendar}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <TextField
                  label="Reference Number (Optional)"
                  value={formData.referenceNumber}
                  onChange={updateReferenceNumber}
                  placeholder="e.g., CHK-12345"
                  icon={FileText}
                />
                <TextField
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={updateNotes}
                  placeholder="Payment notes..."
                  icon={FileText}
                />
              </div>
            </div>

            {/* Bonus & Deductions */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Calculator size={16} />
                Bonus & Deductions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Bonus / Allowances (Rs)"
                  type="number"
                  value={formData.bonus}
                  onChange={updateBonus}
                  placeholder="0"
                  icon={DollarSign}
                />
                <TextField
                  label="Extra Deductions (Rs)"
                  type="number"
                  value={formData.deductions}
                  onChange={updateDeductions}
                  placeholder="0"
                  icon={DollarSign}
                />
              </div>
            </div>

            {/* Salary Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign size={16} />
                Salary Summary
              </h3>

              {/* Existing Payroll Warning */}
              {existingPayroll && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Payroll Already Exists</p>
                      <p className="text-xs text-amber-700 mt-1">
                        A payroll record already exists for this staff member in {MONTHS.find(m => m.value === formData.month)?.label} {formData.year}.
                        <br />
                        <strong>Currently paid:</strong> Rs. {existingPayroll.amountPaid.toLocaleString()} ({existingPayroll.status})
                        <br />
                        To update, use the "Edit" button in the payroll list instead of creating a new record.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Base Salary</p>
                  <p className="text-lg font-bold text-slate-900">Rs. {calculations.baseSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Gross Salary</p>
                  <p className="text-lg font-bold text-slate-900">Rs. {calculations.grossSalary.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600 mb-1">Deductions</p>
                  <p className="text-lg font-bold text-rose-600">- Rs. {calculations.deductions.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Net Salary</p>
                  <p className="text-lg font-bold text-emerald-600">Rs. {calculations.netSalary.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.staffId || !!existingPayroll}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : existingPayroll ? (
                <>
                  <AlertCircle size={18} />
                  Payroll Already Exists
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Pay Salary
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSalaryForm;
