import { X, User, Mail, Shield, Lock, Monitor, Eye, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import type { StaffMember, CreateStaffInput } from '../../pages/store-admin/staff-management/types/staff.types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { terminalsApi } from '../../service/api';
import { toast } from '@/lib/toast';

interface Terminal {
    id: string;
    deviceName: string;
}

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: CreateStaffInput) => Promise<{ success: boolean; error?: string }>;
    editMember?: StaffMember;
    onEdit?: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
    allStaff?: StaffMember[];
}

const PASSWORD_HINT = '8+ chars, uppercase, lowercase, digit, special character';

interface FormState extends CreateStaffInput {
    isActive: boolean;
}

export default function AddStaffModal({ isOpen, onClose, onAdd, editMember, onEdit, allStaff = [] }: AddStaffModalProps) {
    const [formData, setFormData] = useState<FormState>({
        name: '',
        email: '',
        role: 'CASHIER',
        password: '',
        isActive: true,
        assignedTerminalIds: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [terminals, setTerminals] = useState<Terminal[]>([]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (editMember) {
                const terminalIds = editMember.assignedTerminals?.map(t => t.id) || [];
                setFormData({
                    name: editMember.name,
                    email: editMember.email,
                    role: editMember.role as any,
                    password: '',
                    isActive: editMember.status === 'active',
                    assignedTerminalIds: terminalIds,
                });
            } else {
                setFormData({ name: '', email: '', role: 'CASHIER', password: '', isActive: true, assignedTerminalIds: [] });
            }
            setError(null);
            setShowPassword(false);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, editMember]);

    useEffect(() => {
        if (isOpen && formData.role === 'CASHIER') {
            terminalsApi.list()
                .then(res => {
                    const data = res.data?.data;
                    setTerminals(Array.isArray(data) ? data : []);
                })
                .catch(() => setTerminals([]));
        } else {
            setTerminals([]);
        }
    }, [isOpen, formData.role]);

    if (!isOpen) return null;

    const handleClose = () => {
        setError(null);
        setFormData({ name: '', email: '', role: 'CASHIER', password: '', isActive: true, assignedTerminalIds: [] });
        setShowPassword(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Required terminal for Cashier
        if (formData.role === 'CASHIER' && (!formData.assignedTerminalIds || formData.assignedTerminalIds.length === 0)) {
            setError('Terminal assignment is required for Cashiers.');
            toast.error('Terminal assignment is required for Cashiers.', "Validation Error");
            return;
        }

        if (!editMember) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
            if (!passRegex.test(formData.password)) {
                setError('Invalid password security requirements.');
                return;
            }
        } else if (formData.password && formData.password.trim().length > 0) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
            if (!passRegex.test(formData.password)) {
                setError('Invalid password security requirements.');
                return;
            }
        }

        setLoading(true);
        const result = editMember && onEdit
            ? await onEdit(editMember.id, {
                name: formData.name,
                role: formData.role,
                isActive: (formData as any).isActive,
                ...(formData.password ? { password: formData.password } : {}),
                ...(formData.role === "CASHIER" ? { assignedTerminalIds: formData.assignedTerminalIds || [] } : {})
              })
            : await onAdd(formData);
        setLoading(false);

        if (result.success) {
            toast.success(`Staff member ${editMember ? 'updated' : 'created'} successfully`, "Staff Managed");
            handleClose();
        } else {
            const errorMsg = result.error || `Failed to ${editMember ? 'update' : 'create'} staff.`;
            setError(errorMsg);
            toast.error(errorMsg, "Action Failed");
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
            <div 
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" 
                onClick={handleClose}
            ></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User size={20} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest leading-none">
                            {editMember ? 'Edit Staff Member' : 'Add New Staff Member'}
                        </h2>
                    </div>
                    <button onClick={handleClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                            <Info size={16} />
                            {error}
                        </div>
                    )}

                    {/* Section 1: Personal Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                            <User size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter full name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                    <input
                                        required
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Access & Credentials */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                            <Shield size={14} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">Employment Details</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                    Role <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <select
                                        value={formData.role}
                                        onChange={e => {
                                            const role = e.target.value as any;
                                            setFormData({ ...formData, role, assignedTerminalIds: role === 'ACCOUNTANT' ? [] : formData.assignedTerminalIds });
                                        }}
                                        className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                                    >
                                        <option value="CASHIER">Cashier</option>
                                        <option value="ACCOUNTANT">Accountant</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                </div>
                            </div>

                            {formData.role === 'CASHIER' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">Assign Terminal<span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <select
                                            value={formData.assignedTerminalIds?.[0] || ""}
                                            onChange={e => setFormData({ ...formData, assignedTerminalIds: e.target.value ? [e.target.value] : [] })}
                                            className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            <option value="" disabled>Select Terminal</option>
                                            {terminals.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.deviceName}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                    Password {!editMember && <span className="text-rose-500">*</span>}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        required={!editMember}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {editMember && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">Account Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.isActive ? "active" : "inactive"}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.value === "active" })}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1">{PASSWORD_HINT}</p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-6 shrink-0 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={handleClose}
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
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>{editMember ? 'Update Profile' : 'Save Staff'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
