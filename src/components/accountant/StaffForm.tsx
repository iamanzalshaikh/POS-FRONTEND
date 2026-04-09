import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, User, Phone, Mail, Calendar, MapPin, DollarSign, Briefcase, Heart } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type SalaryType = 'PER_MONTH' | 'PER_LECTURE';
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
  salaryType: SalaryType;
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

const SALARY_TYPES = [
  { value: 'PER_MONTH', label: 'Per Month' },
  { value: 'PER_LECTURE', label: 'Per Lecture' },
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
  salaryType: 'PER_MONTH',
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
          maxLength={maxLength}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error ? 'border-red-300 bg-red-50' : 'border-slate-300'
          }`}
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
          <option value="">Select {label.toLowerCase()}</option>
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
  const updateMobile = useCallback((v: string) => setFormData((p) => ({ ...p, mobile: v })), []);
  const updateRole = useCallback((v: string) => setFormData((p) => ({ ...p, role: v })), []);
  const updateMaritalStatus = useCallback((v: string) => setFormData((p) => ({ ...p, maritalStatus: v as MaritalStatus })), []);
  const updateDob = useCallback((v: string) => setFormData((p) => ({ ...p, dob: v })), []);
  const updateJoinDate = useCallback((v: string) => setFormData((p) => ({ ...p, joinDate: v })), []);
  const updateAddress = useCallback((v: string) => setFormData((p) => ({ ...p, address: v })), []);
  const updateBasicSalary = useCallback((v: string) => setFormData((p) => ({ ...p, basicSalary: v })), []);
  const updateSalaryType = useCallback((v: string) => setFormData((p) => ({ ...p, salaryType: v as SalaryType })), []);
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
    else if (!/^[\d\s+\-()]+$/.test(formData.mobile)) e.mobile = 'Invalid mobile number format';

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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            <User className="text-blue-600" size={24} />
            {initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={16} />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <TextField label="First Name" value={formData.firstName} onChange={updateFirstName} required error={errors.firstName} placeholder="Enter first name" />
                <TextField label="Last Name" value={formData.lastName} onChange={updateLastName} required error={errors.lastName} placeholder="Enter last name" />
                <TextField label="Father/Husband Name" value={formData.fatherName} onChange={updateFatherName} required error={errors.fatherName} placeholder="Enter name" />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Phone size={16} />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="CNIC" value={formData.cnic} onChange={handleCnicChange} required error={errors.cnic} placeholder="00000-0000000-0" maxLength={15} icon={User} />
                <TextField label="Mobile Number" type="tel" value={formData.mobile} onChange={updateMobile} required error={errors.mobile} placeholder="03XX-XXXXXXX" icon={Phone} />
                <TextField label="Email (Optional)" type="email" value={formData.email} onChange={updateEmail} error={errors.email} placeholder="email@example.com" icon={Mail} />
                <TextField label="Address (Optional)" value={formData.address} onChange={updateAddress} error={errors.address} placeholder="Enter address" icon={MapPin} />
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SelectField label="Role" value={formData.role} onChange={updateRole} options={ROLES} required error={errors.role} icon={Briefcase} />
                <TextField label="Basic Salary (Rs)" type="number" value={formData.basicSalary} onChange={updateBasicSalary} required error={errors.basicSalary} placeholder="0" icon={DollarSign} />
                <SelectField label="Salary Type" value={formData.salaryType} onChange={updateSalaryType} options={SALARY_TYPES} icon={DollarSign} />
                <SelectField label="Joining Type" value={formData.joiningType} onChange={updateJoiningType} options={JOINING_TYPES} icon={Briefcase} />
                <TextField label="Join Date" type="date" value={formData.joinDate} onChange={updateJoinDate} required error={errors.joinDate} icon={Calendar} />
                <SelectField label="Status" value={formData.status} onChange={updateStatus} options={STATUSES} icon={CheckCircle2} />
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Heart size={16} />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Marital Status" value={formData.maritalStatus} onChange={updateMaritalStatus} options={MARITAL_STATUSES} icon={Heart} />
                <TextField label="Date of Birth" type="date" value={formData.dob} onChange={updateDob} required error={errors.dob} icon={Calendar} />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex gap-3">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle2 size={18} /> {initialData ? 'Update Staff' : 'Save Staff'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffForm;
