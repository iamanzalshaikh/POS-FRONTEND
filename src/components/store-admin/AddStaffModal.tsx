import { X, User, Mail, Shield, Lock, Monitor } from 'lucide-react';
import type { StaffMember, CreateStaffInput } from '../../pages/store-admin/staff-management/types/staff.types';
import { useState, useEffect } from 'react';
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

export default function AddStaffModal({ isOpen, onClose, onAdd, editMember, onEdit }: AddStaffModalProps) {
    const [formData, setFormData] = useState<CreateStaffInput>({
        name: '',
        email: '',
        role: 'CASHIER',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [terminals, setTerminals] = useState<Terminal[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (editMember) {
                setFormData({
                    name: editMember.name,
                    email: editMember.email,
                    role: editMember.role as any,
                    password: ''
                });
            } else {
                setFormData({ name: '', email: '', role: 'CASHIER', password: '' });
            }
            setError(null);
            setShowPassword(false);
        }
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
        setFormData({ name: '', email: '', role: 'CASHIER', password: '' });
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
                ...(formData.password ? { password: formData.password } : {}),
                ...(formData.role === "CASHIER" ? { assignedTerminalIds: formData.assignedTerminalIds } : {})
              }) 
            : await onAdd(formData);
        setLoading(false);

        if (result.success) {
            handleClose();
        } else {
            setError(result.error || `Failed to ${editMember ? 'update' : 'create'} staff.`);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}></div>

            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editMember ? 'Edit Staff Details' : 'Add New Staff'}</h2>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">{editMember ? 'Modify identity or permissions' : 'Onboard Cashier or Accountant'}</p>
                    </div>
                    <button onClick={handleClose} type="button" className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Jane Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    required
                                    type="email"
                                    placeholder="jane.doe@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Role</label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                <select
                                    value={formData.role}
                                    onChange={e => {
                                        const role = e.target.value as 'CASHIER' | 'ACCOUNTANT';
                                        setFormData({ ...formData, role, assignedTerminalIds: role === 'ACCOUNTANT' ? undefined : formData.assignedTerminalIds });
                                    }}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-xs appearance-none cursor-pointer"
                                >
                                    <option value="CASHIER">Cashier</option>
                                    <option value="ACCOUNTANT">Accountant</option>
                                </select>
                            </div>
                        </div>
                        {formData.role === 'CASHIER' && (
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                                    <Monitor className="w-4 h-4" /> Assign Terminal
                                </label>
                                <div className="relative">
                                    <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                    <select
                                        value={formData.assignedTerminalIds?.[0] || ""}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, assignedTerminalIds: val ? [val] : undefined });
                                        }}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-xs appearance-none cursor-pointer"
                                    >
                                        <option value="">No Terminal Assigned</option>
                                        {terminals.map(t => (
                                            <option key={t.id} value={t.id}>{t.deviceName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}


                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password {editMember ? '(Leave blank to keep same)' : '(required)'}</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    required={!editMember}
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium ml-1">{PASSWORD_HINT}</p>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-[#1E1B4B] text-white rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-[#2563EB] shadow-lg shadow-[#1E1B4B]/25 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (editMember ? 'Saving...' : 'Creating...') : (editMember ? 'Save Changes' : 'Create Staff')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
