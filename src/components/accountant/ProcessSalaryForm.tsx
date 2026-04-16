import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, FileText, Calculator, CheckCircle2, Loader2, AlertCircle, User } from 'lucide-react';
import { getStaff, createPayroll, getPayroll, type StaffMember } from '../../api/staff.api';
import EnhancedCalendar from '../global-components/Calendar/EnhancedCalendar';
import { toast } from '@/lib/toast';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessSalaryFormData {
  staffId: string;
  month: number;
  year: number;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  bonus: string;
  deductions: string;
  paymentMethod: string;
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
  paymentMethod: 'CASH',
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
  options: readonly { value: string | number; label: string }[];
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

  // Fetch active staff on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchStaffList = async () => {
      setLoadingStaff(true);
      try {
        const response = await getStaff({ status: 'ACTIVE', limit: 500 });
        if (response.success) {
          setStaffList(response.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      } finally {
        setLoadingStaff(false);
      }
    };

    fetchStaffList();
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
        const response = await getPayroll({
          staffId: formData.staffId,
          month: formData.month,
          year: formData.year,
        });

        if (response.success && response.data.items.length > 0) {
          setExistingPayroll({
            id: response.data.items[0].id,
            amountPaid: Number(response.data.items[0].amountPaid),
            status: response.data.items[0].status,
          });
        } else {
          setExistingPayroll(null);
        }
      } catch (err) {
        setExistingPayroll(null);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    checkExistingPayroll();
  }, [formData.staffId, formData.month, formData.year]);

  // Calculated values
  const calculations = useMemo(() => {
    const baseSalary = Number(selectedStaff?.baseSalary || selectedStaff?.monthlySalary || 0);
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
  }, [selectedStaff, formData.bonus, formData.deductions]);

  // Field update callbacks
  const updateStaffId = useCallback((v: string) => setFormData((p) => ({ ...p, staffId: v })), []);
  const updateMonth = useCallback((v: string) => setFormData((p) => ({ ...p, month: Number(v) || p.month })), []);
  const updateYear = useCallback((v: string) => setFormData((p) => ({ ...p, year: Number(v) || p.year })), []);
  const updateBasicSalary = useCallback((v: string) => setFormData((p) => ({ ...p, basicSalary: v })), []);
  const updateJoiningType = useCallback((v: string) => setFormData((p) => ({ ...p, joiningType: v as any })), []);
  const updateStatus = useCallback((v: string) => setFormData((p) => ({ ...p, status: v as any })), []);
  const updatePaymentMethod = useCallback((v: string) => setFormData((p) => ({ ...p, paymentMethod: v })), []);
  const updatePaymentDate = useCallback((v: string) => setFormData((p) => ({ ...p, paymentDate: v })), []);
  const updateReferenceNumber = useCallback((v: string) => setFormData((p) => ({ ...p, referenceNumber: v })), []);
  const updateNotes = useCallback((v: string) => setFormData((p) => ({ ...p, notes: v })), []);
  const updateBonus = useCallback((v: string) => setFormData((p) => ({ ...p, bonus: v })), []);
  const updateDeductions = useCallback((v: string) => setFormData((p) => ({ ...p, deductions: v })), []);

  // Validation
  const validate = useCallback(() => {
    const e: Partial<Record<keyof ProcessSalaryFormData, string>> = {};

    if (!formData.staffId) e.staffId = 'Please select a staff member';
    if (!formData.month) e.month = 'Select month';
    if (!formData.year) e.year = 'Select year';
    if (!formData.paymentDate) e.paymentDate = 'Payment date is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (existingPayroll && existingPayroll.status === 'PAID') {
      toast.error('Salary already paid for this cycle');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        staffId: formData.staffId,
        month: formData.month,
        year: formData.year,
        bonus: calculations.bonus,
        deductions: calculations.deductions,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      };

      await createPayroll(payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process salary payment');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, calculations, existingPayroll, onSuccess, onClose]);

  // Close handler
  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 1; y++) {
    yearOptions.push({ value: y, label: String(y) });
  }

  const PAYMENT_METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden font-sans">
      <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
      />
      
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                Pay Staff Salary
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                Create a new salary payment record
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-emerald-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Select Employee</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Name of Staff"
                  value={formData.staffId}
                  onChange={updateStaffId}
                  options={staffList.map((s) => ({
                    value: s.id,
                    label: `${s.name} [${s.role}]`,
                  }))}
                  required
                  error={errors.staffId}
                  icon={User}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                    Base Salary
                  </label>
                  <div className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl text-[12px] font-black text-slate-900 dark:text-white shadow-inner">
                    {calculations.baseSalary > 0 
                      ? `PKR ${calculations.baseSalary.toLocaleString()}` 
                      : '— PICK STAFF —'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-emerald-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Month and Year</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SelectField
                  label="Month"
                  value={String(formData.month)}
                  onChange={updateMonth}
                  options={MONTHS}
                  required
                  error={errors.month}
                  icon={Calendar}
                />
                <SelectField
                  label="Year"
                  value={String(formData.year)}
                  onChange={updateYear}
                  options={yearOptions}
                  required
                  error={errors.year}
                  icon={Calendar}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <EnhancedCalendar
                    value={formData.paymentDate}
                    onChange={updatePaymentDate}
                    required
                    className="w-full"
                    inputClassName="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer hover:border-blue-500/50"
                  />
                  {errors.paymentDate && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-1 flex items-center gap-1 animate-in slide-in-from-left-2">
                       <AlertCircle size={10} /> {errors.paymentDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-emerald-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bonus and Deductions</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Extra Bonus (+)"
                  type="number"
                  value={formData.bonus}
                  onChange={updateBonus}
                  placeholder="0.00"
                  icon={DollarSign}
                />
                <TextField
                  label="Deductions (-)"
                  type="number"
                  value={formData.deductions}
                  onChange={updateDeductions}
                  placeholder="0.00"
                  icon={DollarSign}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-1 bg-emerald-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Payment Channel</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={updatePaymentMethod}
                  options={PAYMENT_METHODS}
                  required
                  error={errors.paymentMethod}
                  icon={DollarSign}
                />
                <TextField
                  label="Reference Number"
                  value={formData.referenceNumber}
                  onChange={updateReferenceNumber}
                  placeholder="Enter reference..."
                  icon={FileText}
                />
              </div>
              <div className="grid grid-cols-1">
                <TextField
                  label="Any Notes"
                  value={formData.notes}
                  onChange={updateNotes}
                  placeholder="Extra info..."
                  icon={FileText}
                />
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-1000" />
              
              <div className="relative z-10">
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Calculator size={14} /> Total Calculation
                </h3>

                {existingPayroll && (
                  <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in zoom-in-95">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="text-[10px] font-bold text-rose-200 uppercase tracking-widest leading-normal">
                        CRITICAL: Record already exists for this cycle. Entry is blocked to prevent duplicate disbursement.
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
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Changes</p>
                    <p className={`text-sm font-black tabular-nums ${calculations.bonus >= calculations.deductions ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calculations.bonus - calculations.deductions >= 0 ? '+' : ''} PKR {(calculations.bonus - calculations.deductions).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1 border-l border-white/10 pl-0 md:pl-8 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] mb-1">Total to Pay</p>
                    <p className="text-2xl font-black text-white tabular-nums tracking-tighter">
                      PKR {calculations.netSalary.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.staffId || !!existingPayroll}
              className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                isSubmitting || !!existingPayroll 
                  ? 'bg-slate-400 border-b-4 border-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 border-b-4 border-emerald-800 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : existingPayroll ? (
                <>
                  <XCircle size={16} />
                  <span>Already Paid</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Payment</span>
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

const XCircle = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default ProcessSalaryForm;
