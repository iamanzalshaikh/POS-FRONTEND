import { X, Truck, Phone, MapPin, CheckCircle2, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { createPortal } from 'react-dom';
import type { Supplier } from '@/api/suppliers.api';
import { validatePakistanMobile, formatPakistanMobile } from '@/utils/validation';

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: {
        name: string;
        companyName?: string;
        phone?: string;
        address?: string;
        addressLine?: string;
        city?: string;
        state?: string;
        country?: string;
    }) => Promise<{ success: boolean; error?: string }>;
    editSupplier?: Supplier | null;
    onEdit?: (id: string, data: any) => Promise<{ success: boolean; error?: string }>;
}

export default function AddSupplierModal({ isOpen, onClose, onAdd, editSupplier, onEdit }: AddSupplierModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        phone: '',
        addressLine: '',
        city: '',
        state: '',
        country: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (editSupplier) {
                setFormData({
                    name: editSupplier.name,
                    companyName: (editSupplier as any).companyName || '',
                    phone: editSupplier.phone || '',
                    addressLine: (editSupplier as any).addressLine || '',
                    city: (editSupplier as any).city || '',
                    state: (editSupplier as any).state || '',
                    country: (editSupplier as any).country || ''
                });
            } else {
                setFormData({ name: '', companyName: '', phone: '', addressLine: '', city: '', state: '', country: '' });
            }
            setError(null);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, editSupplier]);

    if (!isOpen) return null;

    const handleClose = () => {
        setError(null);
        setFormData({ name: '', companyName: '', phone: '', addressLine: '', city: '', state: '', country: '' });
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError('Supplier name is required');
            return;
        }

        if (!formData.phone.trim()) {
            setError('Contact phone is required');
            return;
        }

        if (!validatePakistanMobile(formData.phone)) {
            setError('Invalid Pakistan mobile number (Required 11 digits starting with 03, e.g., 03XX-XXXXXXX)');
            return;
        }

        setLoading(true);
        const result = editSupplier && onEdit
            ? await onEdit(editSupplier.id, {
                name: formData.name.trim(),
                companyName: formData.companyName.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                addressLine: formData.addressLine.trim() || undefined,
                city: formData.city.trim() || undefined,
                state: formData.state.trim() || undefined,
                country: formData.country.trim() || undefined
              })
            : await onAdd({
                name: formData.name.trim(),
                companyName: formData.companyName.trim() || undefined,
                phone: formData.phone.trim() || undefined,
                addressLine: formData.addressLine.trim() || undefined,
                city: formData.city.trim() || undefined,
                state: formData.state.trim() || undefined,
                country: formData.country.trim() || undefined
              });
        setLoading(false);

        if (result.success) {
            toast.success(`Supplier ${editSupplier ? 'updated' : 'created'} successfully`, "Operation Successful");
            handleClose();
        } else {
            toast.error(result.error || `Failed to ${editSupplier ? 'update' : 'create'} supplier.`, "Action Failed");
            setError(result.error || `Failed to ${editSupplier ? 'update' : 'create'} supplier.`);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
            <div 
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" 
                onClick={handleClose}
            ></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Truck size={20} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest leading-none">
                            {editSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </h2>
                    </div>
                    <button onClick={handleClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-[10px] font-black uppercase tracking-widest">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 flex items-center gap-3">
                            <Info size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[#1e293b] dark:text-slate-300">
                                Supplier Name <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative group">
                                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    required
                                    type="text"
                                    placeholder="Enter vendor name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#1e293b] dark:text-slate-300">
                                Company Name
                            </label>
                            <input
                                type="text"
                                placeholder="Optional company name"
                                value={formData.companyName}
                                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#1e293b] dark:text-slate-300">
                                Contact Phone <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    required
                                    type="text"
                                    placeholder="0323-3456789"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: formatPakistanMobile(e.target.value) })}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[#1e293b] dark:text-slate-300">
                                Address Line
                            </label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Street / Area"
                                    value={formData.addressLine}
                                    onChange={e => setFormData({ ...formData, addressLine: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <input
                                type="text"
                                placeholder="City"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            <input
                                type="text"
                                placeholder="State"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                            <input
                                type="text"
                                placeholder="Country"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-6 shrink-0 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1e293b] dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Saving...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    <span>{editSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
