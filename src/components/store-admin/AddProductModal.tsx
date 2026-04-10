import { X, Package, Barcode, Plus, Tag, Archive, Percent, Layers, Inbox, UploadCloud, Info, DollarSign } from 'lucide-react';
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
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
                onClick={handleClose}
            ></div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-white/5 dark:border-white/10">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Add New Product</h2>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Inventory Management System</p>
                    </div>
                    <button onClick={handleClose} type="button" className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-all active:scale-95">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
                        {error && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-widest leading-relaxed">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            {/* Left Column: Core Data */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Basic Information</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Name</label>
                                            <div className="relative group">
                                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                                <input 
                                                    required 
                                                    type="text" 
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. Premium Wireless Audio" 
                                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SKU</label>
                                                <div className="relative group">
                                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                                    <input 
                                                        required 
                                                        type="text" 
                                                        value={sku}
                                                        onChange={(e) => setSku(e.target.value)}
                                                        placeholder="SKU-001" 
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Barcode</label>
                                                <div className="relative group">
                                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                                    <input 
                                                        type="text" 
                                                        value={barcode}
                                                        onChange={(e) => setBarcode(e.target.value)}
                                                        placeholder="EAN-13" 
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category Registry</label>
                                            <div className="relative group">
                                                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                                                <select 
                                                    value={categoryId}
                                                    onChange={(e) => setCategoryId(e.target.value)}
                                                    className="w-full pl-12 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white"
                                                >
                                                    <option value="">No Collection Assigned</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Pricing Details</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Buying Cost (Rs)</label>
                                            <div className="relative group">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input required type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black uppercase tracking-widest text-[11px] text-slate-900 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selling Price (Rs)</label>
                                            <div className="relative group">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <input required type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[11px] text-blue-600 dark:text-blue-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Inventory & Media */}
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Inventory Controls</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Initial Stock</label>
                                            <div className="relative group">
                                                <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                                                <input required type="number" value={initialStock} onChange={e => setInitialStock(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium text-slate-900 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Low-Stock Alert</label>
                                            <div className="relative group">
                                                <Inbox className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                                                <input required type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium text-slate-900 dark:text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                        <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Product Media</h3>
                                    </div>

                                    <div className="relative group h-[180px] border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[28px] flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden transition-all hover:border-blue-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        {imagePreview ? (
                                            <div className="relative w-full h-full">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all active:scale-95">
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                                                    <UploadCloud size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Drop Image file</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">PNG, JPG up to 2MB</p>
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-50 dark:border-slate-800 flex gap-4 shrink-0">
                        <button type="button" onClick={handleClose} className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 border border-blue-500 flex items-center justify-center gap-2">
                            {loading ? (
                                <span className="animate-pulse">Authorizing...</span>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Save Product Registry
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
