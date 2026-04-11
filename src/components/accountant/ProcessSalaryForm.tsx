import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all ${
            readOnly ? 'bg-slate-100/50 dark:bg-slate-800/50 cursor-not-allowed border-transparent' : ''
          } ${error ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/50' : ''}`}
        />
      </div>
      {error && (
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-1 flex items-center gap-1 animate-in slide-in-from-left-2">
          <AlertCircle size={10} /> {error}
        </p>
      )}
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
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10">
            <Icon size={16} />
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all ${
            error ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/50' : ''
          }`}
        >
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {error && (
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-1 flex items-center gap-1 animate-in slide-in-from-left-2">
          <AlertCircle size={10} /> {error}
        </p>
      )}
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Backdrop */}
      <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                Payroll Processing
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                Authorized Salary Disbursement
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form className="space-y-8">
            {/* Section: Staff Registry */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Staff Registry</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Staff Member"
                  value={formData.staffId}
                  onChange={updateStaffId}
                  options={staffList.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.role})`,
                  }))}
                  required
                  error={errors.staffId}
                  icon={User}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                    Contract Salary
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl text-[12px] font-black text-slate-900 dark:text-white">
                    {calculations.baseSalary > 0 
                      ? `PKR ${calculations.baseSalary.toLocaleString()}` 
                      : '— SELECT STAFF —'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Fiscal Period */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fiscal Period & Processing</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SelectField
                  label="Cycle Month"
                  value={String(formData.month)}
                  onChange={updateMonth}
                  options={MONTHS}
                  required
                  error={errors.month}
                  icon={Calendar}
                />
                <SelectField
                  label="Fiscal Year"
                  value={String(formData.year)}
                  onChange={updateYear}
                  options={yearOptions}
                  required
                  error={errors.year}
                  icon={Calendar}
                />
                <TextField
                  label="Disbursement Date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={updatePaymentDate}
                  required
                  error={errors.paymentDate}
                  icon={Calendar}
                />
              </div>
            </div>

            {/* Section: Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Adjustments & Ledger Notes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Performance Bonus (PKR)"
                  type="number"
                  value={formData.bonus}
                  onChange={updateBonus}
                  placeholder="0.00"
                  icon={DollarSign}
                />
                <TextField
                  label="Penalty Deductions (PKR)"
                  type="number"
                  value={formData.deductions}
                  onChange={updateDeductions}
                  placeholder="0.00"
                  icon={DollarSign}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Audit Reference"
                  value={formData.referenceNumber}
                  onChange={updateReferenceNumber}
                  placeholder="e.g. CHK-102938"
                  icon={FileText}
                />
                <TextField
                  label="Ledger Notes"
                  value={formData.notes}
                  onChange={updateNotes}
                  placeholder="..."
                  icon={FileText}
                />
              </div>
            </div>

            {/* Section: Fiscal Summary Card */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-800 shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
              
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Calculator size={14} /> Fiscal Calculation Summary
                </h3>

                {/* Conflict Alert */}
                {existingPayroll && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-in shake duration-500">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-[10px] font-bold text-amber-200 uppercase tracking-widest leading-normal">
                        Conflict Detected: A payroll record already exists for this cycle ({MONTHS.find(m=>m.value===formData.month)?.label} {formData.year}). Currently paid: PKR {existingPayroll.amountPaid.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Base Salary</p>
                    <p className="text-sm font-black text-white tabular-nums">PKR {calculations.baseSalary.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Adjustments</p>
                    <p className={`text-sm font-black tabular-nums ${calculations.bonus > calculations.deductions ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculations.bonus - calculations.deductions >= 0 ? '+' : ''} PKR {(calculations.bonus - calculations.deductions).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1 border-l border-slate-800/50 pl-0 md:pl-8 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Final Net Payable</p>
                    <p className="text-2xl font-black text-white tabular-nums tracking-tighter">
                      PKR {calculations.netSalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.staffId || !!existingPayroll}
              className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                isSubmitting || !!existingPayroll 
                  ? 'bg-slate-400 border-b-4 border-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 border-b-4 border-blue-800 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : existingPayroll ? (
                <>
                  <AlertCircle size={16} />
                  <span>Cycle Blocked</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Authorize disbursement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProcessSalaryForm;
