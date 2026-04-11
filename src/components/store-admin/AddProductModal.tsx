import { X, Package, Barcode, Plus, Tag, Archive, Percent, Layers, Inbox, UploadCloud, Info, DollarSign, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createProduct } from '@/api/products.api';
import { getCategories, getSubcategories } from '@/api/category.api';
import { cn } from '@/lib/utils';

interface AddProductModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddProductModal({ open, onClose, onSuccess }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    
    // Form State
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [barcode, setBarcode] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subCategoryId, setSubCategoryId] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('0');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [taxPercentage, setTaxPercentage] = useState('0');
    const [discountPercentage, setDiscountPercentage] = useState('0');
    const [initialStock, setInitialStock] = useState('0');
    const [reorderLevel, setReorderLevel] = useState('10');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            void fetchCategories();
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [open]);

    const fetchCategories = async () => {
        try {
            const res = await getCategories();
            setCategories(res.data?.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    if (!open) return null;

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('sku', sku);
        formData.append('barcode', barcode);
        formData.append('categoryId', categoryId);
        formData.append('purchasePrice', purchasePrice);
        formData.append('sellingPrice', sellingPrice);
        formData.append('taxPercentage', taxPercentage);
        formData.append('initialStock', initialStock);
        formData.append('reorderLevel', reorderLevel);

        if (imageFile) formData.append('image', imageFile);

        try {
            await createProduct(formData);
            onSuccess?.();
            handleClose();
            // Reset state
            setName('');
            setSku('');
            setBarcode('');
            setCategoryId('');
            setPurchasePrice('0');
            setSellingPrice('0');
            setTaxPercentage('0');
            setInitialStock('0');
            setReorderLevel('10');
            setImageFile(null);
            setImagePreview('');
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to save product.");
        } finally {
            setLoading(false);
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
                            <Package size={20} />
                        </div>
                        <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">Add New Product</h2>
                    </div>
                    <button onClick={handleClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        {error && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                <Info size={16} />
                                {error}
                            </div>
                        )}

                        {/* Section 1: Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                                <Tag size={14} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Basic Information</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                        Product Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input 
                                        required 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter product name" 
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                            SKU <span className="text-rose-500">*</span>
                                        </label>
                                        <input 
                                            required 
                                            type="text" 
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            placeholder="SKU-001" 
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">Barcode</label>
                                        <input 
                                            type="text" 
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            placeholder="EAN-13" 
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                        Collection / Category <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select 
                                            required
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm appearance-none cursor-pointer text-slate-900 dark:text-white"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Financials */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                                <DollarSign size={14} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Financial Details</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                        Buying Cost (Rs) <span className="text-rose-500">*</span>
                                    </label>
                                    <input required type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                                        Selling Price (Rs) <span className="text-rose-500">*</span>
                                    </label>
                                    <input required type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-sm text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Inventory & Media */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                                <Archive size={14} />
                                <h3 className="text-[10px] font-black uppercase tracking-widest">Stock & Media</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">Initial Stock</label>
                                    <input required type="number" value={initialStock} onChange={e => setInitialStock(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">Low Stock Alert</label>
                                    <input required type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white" />
                                </div>
                            </div>

                            {/* Image Upload Area */}
                            <div className="relative group h-[140px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 overflow-hidden">
                                {imagePreview ? (
                                    <div className="relative w-full h-full">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all active:scale-95">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-slate-400">
                                        <UploadCloud size={28} strokeWidth={1.5} />
                                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">Upload Product Image</p>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
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
                                    <span>Save Product Registry</span>
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
