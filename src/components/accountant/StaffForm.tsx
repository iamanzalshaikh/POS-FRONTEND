import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, CheckCircle2, AlertCircle, User, Phone, Mail, Calendar, MapPin, DollarSign, Briefcase, Heart } from 'lucide-react';
import EnhancedCalendar from '../global-components/Calendar/EnhancedCalendar';
import { validatePakistanMobile, formatPakistanMobile } from '../../utils/validation';

// ============================================================================
// TYPES
// ============================================================================

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type JoiningType = 'FULL_TIME' | 'PART_TIME' | 'VISITING';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'OTHER';

export interface StaffFormData {
  firstName: string;
  lastName: string;
  fatherName: string;
  cnic: string;
  email: string;
  mobile: string;
  role: string;
  maritalStatus: MaritalStatus;
  dob: string;
  joinDate: string;
  address: string;
  basicSalary: string;
  joiningType: JoiningType;
  status: StaffStatus;
}

export interface StaffFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => Promise<void>;
  initialData?: StaffFormData | null;
  isSubmitting: boolean;
}

// ============================================================================
// CONSTANTS (stable references)
// ============================================================================

const ROLES = [
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SALES_ASSOCIATE', label: 'Sales Associate' },
  { value: 'INVENTORY_CLERK', label: 'Inventory Clerk' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'CLEANER', label: 'Cleaner' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'OTHER', label: 'Other' },
] as const;

const JOINING_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'VISITING', label: 'Visiting' },
] as const;

const MARITAL_STATUSES = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'OTHER', label: 'Other' },
] as const;

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const;

const EMPTY_FORM: StaffFormData = {
  firstName: '',
  lastName: '',
  fatherName: '',
  cnic: '',
  email: '',
  mobile: '',
  role: '',
  maritalStatus: 'SINGLE',
  dob: '',
  joinDate: new Date().toISOString().split('T')[0],
  address: '',
  basicSalary: '',
  joiningType: 'FULL_TIME',
  status: 'ACTIVE',
};

// ============================================================================
// STABLE SUB-COMPONENTS (defined OUTSIDE, memoized)
// ============================================================================

interface FieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}

const TextField = memo(function TextField({
  label,
  value,
  onChange,
  required,
  error,
  icon: Icon,
  placeholder,
  type = 'text',
  maxLength,
}: FieldProps) {
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
          maxLength={maxLength}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all ${
            error ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/50' : ''
          }`}
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
  options: readonly { value: string; label: string }[];
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
}

const SelectField = memo(function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  icon: Icon,
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
          <option value="">Select {label.toLowerCase()}</option>
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

const StaffForm: React.FC<StaffFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  // Local state - separate piece of state for form data
  const [formData, setFormData] = useState<StaffFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StaffFormData, string>>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;
    
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      setFormData({ ...EMPTY_FORM });
    }
    setErrors({});
  }, [isOpen, initialData]);

  // CNIC formatter - stable callback
  const handleCnicChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) formatted = digits.slice(0, 5);
    if (digits.length > 5) formatted += '-' + digits.slice(5, 12);
    if (digits.length > 12) formatted += '-' + digits.slice(12, 13);
    
    setFormData((prev) => ({ ...prev, cnic: formatted }));
  }, []);

  // Stable field update callbacks
  const updateFirstName = useCallback((v: string) => setFormData((p) => ({ ...p, firstName: v })), []);
  const updateLastName = useCallback((v: string) => setFormData((p) => ({ ...p, lastName: v })), []);
  const updateFatherName = useCallback((v: string) => setFormData((p) => ({ ...p, fatherName: v })), []);
  const updateEmail = useCallback((v: string) => setFormData((p) => ({ ...p, email: v })), []);
  const updateMobile = useCallback((v: string) => {
    // Basic formatting as user types
    const formatted = formatPakistanMobile(v);
    setFormData((p) => ({ ...p, mobile: formatted }));
  }, []);
  const updateRole = useCallback((v: string) => setFormData((p) => ({ ...p, role: v })), []);
  const updateMaritalStatus = useCallback((v: string) => setFormData((p) => ({ ...p, maritalStatus: v as MaritalStatus })), []);
  const updateDob = useCallback((v: string) => setFormData((p) => ({ ...p, dob: v })), []);
  const updateJoinDate = useCallback((v: string) => setFormData((p) => ({ ...p, joinDate: v })), []);
  const updateAddress = useCallback((v: string) => setFormData((p) => ({ ...p, address: v })), []);
  const updateBasicSalary = useCallback((v: string) => setFormData((p) => ({ ...p, basicSalary: v })), []);
  const updateJoiningType = useCallback((v: string) => setFormData((p) => ({ ...p, joiningType: v as JoiningType })), []);
  const updateStatus = useCallback((v: string) => setFormData((p) => ({ ...p, status: v as StaffStatus })), []);

  // Validation - runs only on submit
  const validate = useCallback(() => {
    const e: Partial<Record<keyof StaffFormData, string>> = {};

    if (!formData.firstName.trim()) e.firstName = 'First name is required';
    if (!formData.lastName.trim()) e.lastName = 'Last name is required';
    if (!formData.fatherName.trim()) e.fatherName = 'Father/Husband name is required';

    const cnicDigits = formData.cnic.replace(/\D/g, '');
    if (!cnicDigits) e.cnic = 'CNIC is required';
    else if (cnicDigits.length !== 13) e.cnic = 'CNIC must be 13 digits (format: 00000-0000000-0)';
    else if (formData.cnic.length !== 15) e.cnic = 'Invalid CNIC format';

    if (!formData.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!validatePakistanMobile(formData.mobile)) e.mobile = 'Invalid Pakistan mobile number (Required 11 digits starting with 03, e.g., 03XX-XXXXXXX)';

    if (!formData.role) e.role = 'Role is required';
    if (!formData.dob) e.dob = 'Date of birth is required';
    if (!formData.joinDate) e.joinDate = 'Join date is required';
    if (!formData.basicSalary || Number(formData.basicSalary) < 0) e.basicSalary = 'Valid salary amount is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  }, [formData, validate, onSubmit]);

  // Close handler
  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
  }, [isSubmitting, onClose]);

  // Don't render if closed
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Backdrop */}
      <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
          onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                {initialData ? 'Edit Staff Member' : 'Add New Staff'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                Staff registration form
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form className="space-y-10">
            {/* Section: Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Personal Info</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <TextField label="First Name" value={formData.firstName} onChange={updateFirstName} required error={errors.firstName} placeholder="Enter first name" />
                <TextField label="Last Name" value={formData.lastName} onChange={updateLastName} required error={errors.lastName} placeholder="Enter last name" />
                <TextField label="Father/Husband Name" value={formData.fatherName} onChange={updateFatherName} required error={errors.fatherName} placeholder="Enter name" />
              </div>
            </div>

            {/* Section: Contact Registry */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contact Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="CNIC Number" value={formData.cnic} onChange={handleCnicChange} required error={errors.cnic} placeholder="00000-0000000-0" maxLength={15} icon={User} />
                <TextField label="Mobile Number" type="tel" value={formData.mobile} onChange={updateMobile} required error={errors.mobile} placeholder="03XX-XXXXXXX" icon={Phone} />
                <TextField label="Email Address" type="email" value={formData.email} onChange={updateEmail} error={errors.email} placeholder="email@example.com" icon={Mail} />
                <TextField label="Home Address" value={formData.address} onChange={updateAddress} error={errors.address} placeholder="Enter your address" icon={MapPin} />
              </div>
            </div>

            {/* Section: Employment Parameters */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Job Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SelectField label="Role" value={formData.role} onChange={updateRole} options={ROLES} required error={errors.role} icon={Briefcase} />
                <TextField label="Salary Amount (PKR)" type="number" value={formData.basicSalary} onChange={updateBasicSalary} required error={errors.basicSalary} placeholder="0.00" icon={DollarSign} />
                <SelectField label="Job Type" value={formData.joiningType} onChange={updateJoiningType} options={JOINING_TYPES} icon={Briefcase} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                    Joining Date <span className="text-rose-500">*</span>
                  </label>
                  <EnhancedCalendar
                    value={formData.joinDate}
                    onChange={updateJoinDate}
                    required
                    className="w-full"
                    inputClassName="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer hover:border-blue-500/50"
                  />
                  {errors.joinDate && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-1 flex items-center gap-1 animate-in slide-in-from-left-2">
                       <AlertCircle size={10} /> {errors.joinDate}
                    </p>
                  )}
                </div>
                <SelectField label="Status" value={formData.status} onChange={updateStatus} options={STATUSES} icon={CheckCircle2} />
              </div>
            </div>

            {/* Section: Demographics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Other Info</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Marital Status" value={formData.maritalStatus} onChange={updateMaritalStatus} options={MARITAL_STATUSES} icon={Heart} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <EnhancedCalendar
                    value={formData.dob}
                    onChange={updateDob}
                    required
                    className="w-full"
                    inputClassName="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer hover:border-blue-500/50"
                  />
                  {errors.dob && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 ml-1 flex items-center gap-1 animate-in slide-in-from-left-2">
                       <AlertCircle size={10} /> {errors.dob}
                    </p>
                  )}
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
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:bg-slate-400 disabled:border-slate-500 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{initialData ? 'Save Changes' : 'Add Staff'}</span>
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

export default StaffForm;
