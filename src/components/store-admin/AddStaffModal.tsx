import { X, User, Mail, Shield, Lock, Monitor, Eye, EyeOff } from 'lucide-react';
import type { StaffMember, CreateStaffInput } from '../../pages/store-admin/staff-management/types/staff.types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { terminalsApi } from '../../service/api';

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
}

const PASSWORD_HINT = '8+ chars, uppercase, lowercase, digit, special character';

interface FormState extends CreateStaffInput {
    isActive: boolean;
}

export default function AddStaffModal({ isOpen, onClose, onAdd, editMember, onEdit }: AddStaffModalProps) {
    const [formData, setFormData] = useState<FormState>({
        name: '',
        email: '',
        role: 'CASHIER',
        password: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [terminals, setTerminals] = useState<Terminal[]>([]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (editMember) {
                // ... rest of the same logic
                const terminalIds = editMember.assignedTerminals?.map(t => t.id) || [];
                setFormData({
                    name: editMember.name,
                    email: editMember.email,
                    role: editMember.role as any,
                    password: '',
                    isActive: editMember.status === 'active',
                    assignedTerminalIds: terminalIds.length > 0 ? terminalIds : undefined,
                });
            } else {
                setFormData({ name: '', email: '', role: 'CASHIER', password: '', isActive: true });
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
        setFormData({ name: '', email: '', role: 'CASHIER', password: '', isActive: true });
        setShowPassword(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!editMember) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
            if (!passRegex.test(formData.password)) {
                setError('Password must be 8+ chars with uppercase, lowercase, digit, and special character');
                return;
            }
        } else if (formData.password && formData.password.trim().length > 0) {
            const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;
            if (!passRegex.test(formData.password)) {
                setError('Password must be 8+ chars with uppercase, lowercase, digit, and special character');
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
            handleClose();
        } else {
            setError(result.error || `Failed to ${editMember ? 'update' : 'create'} staff.`);
        }
    };
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden uppercase">
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
                onClick={handleClose}
            ></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-white/5 dark:border-white/10">
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 transition-colors shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{editMember ? 'Edit Personnel' : 'Add New Staff'}</h2>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{editMember ? 'Identity & System Permissions' : 'Onboard Cashier or Accountant'}</p>
                    </div>
                    <button onClick={handleClose} type="button" className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Jane Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    required
                                    type="email"
                                    placeholder="jane.doe@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-widest text-slate-400 ml-1">Access Role</label>
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <select
                                    value={formData.role}
                                    onChange={e => {
                                        const role = e.target.value as 'CASHIER' | 'ACCOUNTANT';
                                        setFormData({ ...formData, role, assignedTerminalIds: role === 'ACCOUNTANT' ? undefined : formData.assignedTerminalIds });
                                    }}
                                    className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white"
                                >
                                    <option value="CASHIER">Cashier</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {formData.role === 'CASHIER' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    Assign Terminal
                                </label>
                                <div className="relative group">
                                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                    <select
                                        value={formData.assignedTerminalIds?.[0] || ""}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, assignedTerminalIds: val ? [val] : undefined });
                                        }}
                                        className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white"
                                    >
                                        <option value="">No Terminal Assigned</option>
                                        {terminals.map(t => (
                                            <option key={t.id} value={t.id}>{t.deviceName}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}


                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password {editMember ? '(Blank to keep current)' : '(Required)'}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    required={!editMember}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all active:scale-95"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">{PASSWORD_HINT}</p>
                        </div>

                        {editMember && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Account Status</label>
                                <div className="relative group">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                    <select
                                        value={formData.isActive ? "active" : "inactive"}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.value === "active" })}
                                        className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 border border-blue-500 flex items-center justify-center"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authorizing Protocol...</span>
                            ) : (
                                <span>{editMember ? 'Update Profile' : 'Onboard Staff'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
