import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { StaffMember, CreateStaffData } from '../../api/staff.api';
import { validatePakistanMobile, formatPakistanMobile } from '../../utils/validation';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffData) => Promise<void>;
  editingStaff: StaffMember | null;
}

const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStaff,
}) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    role: '',
    monthlySalary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    phone: '',
    status: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name,
        role: editingStaff.role,
        monthlySalary: Number(editingStaff.monthlySalary) || 0,
        joiningDate: editingStaff.joiningDate.split('T')[0],
        phone: editingStaff.phone || '',
        status: editingStaff.status,
      });
    } else {
      setFormData({
        name: '',
        role: '',
        monthlySalary: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        phone: '',
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [editingStaff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.phone && !validatePakistanMobile(formData.phone)) {
      setError('Invalid Pakistan mobile number (Required 11 digits starting with 03, e.g., 03XX-XXXXXXX)');
      setLoading(false);
      return;
    }

    try {
      await onSubmit({
        firstName: formData.name.trim(),
        role: formData.role.trim(),
        baseSalary: Number(formData.monthlySalary) || 0,
        joiningDate: formData.joiningDate,
        phone: formData.phone?.trim() || undefined,
        status: formData.status,
      } as any);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save staff member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <User size={20} />
            </div>
            <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
              {editingStaff ? 'Update Staff Profile' : 'Register New Staff'}
            </h2>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <X size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                Staff Member Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., John Doe"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                Designation / Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="">Select role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="SALES_ASSOCIATE">Sales Associate</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="INVENTORY_CLERK">Inventory Clerk</option>
                  <option value="SECURITY">Security</option>
                  <option value="CLEANER">Cleaner</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OTHER">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                Contact Phone <span className="text-slate-400 font-normal ml-1">(OPTIONAL)</span>
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: formatPakistanMobile(e.target.value) })}
                placeholder="e.g., 0323-3456789"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
              />
            </div>

            {/* Joining Date & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                  Joining Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                  Account Status <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    required
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 shrink-0 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1e293b] dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#2563eb] text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>{editingStaff ? 'Update Profile' : 'Register Staff'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
  
};

export default StaffModal;
