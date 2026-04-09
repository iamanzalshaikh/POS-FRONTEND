import { X, Package, Barcode, Tag, Archive, Percent, Layers, Inbox, UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createProduct } from '@/api/products.api';
import { getCategories, getSubcategories } from '@/api/category.api';

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

    // Hardcoded subcategory mapping removed - now using dynamic storage
    const getDynamicSubcategories = (catId: string) => {
        if (!catId) return [];
        return getSubcategories(catId);
    };

    useEffect(() => {
        if (open) {
            void fetchCategories();
        }
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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
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
        // formData.append('discountPercentage', discountPercentage);
        formData.append('initialStock', initialStock);
        formData.append('reorderLevel', reorderLevel);

        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            await createProduct(formData);
            onSuccess?.();
            onClose();
            // Reset state
            setName('');
            setSku('');
            setBarcode('');
            setCategoryId('');
            setSubCategoryId('');
            setPurchasePrice('0');
            setSellingPrice('0');
            setTaxPercentage('0');
            setDiscountPercentage('0');
            setInitialStock('0');
            setReorderLevel('10');
            setImageFile(null);
            setImagePreview('');
        } catch (error: any) {
            console.error("Failed to create product:", error);
            setError(error.response?.data?.message || "Failed to save product. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-500 text-sm";
    const labelClasses = "text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-gray-500 ml-1 mb-1.5 block";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in transition-all duration-300" 
                onClick={onClose}
            ></div>

            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-fit max-h-[90vh] rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-scale-up">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Add New Product</h2>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Inventory Management System</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        type="button" 
                        className="p-2.5 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl text-slate-400 transition-all active:scale-95 group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {error && (
                    <div className="mx-8 mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-fade-in shrink-0">
                        <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
                            <X size={16} />
                        </div>
                        <p className="text-sm font-bold text-rose-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Content Area */}
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Left Column: Basic Information & Pricing */}
                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-gray-100 tracking-tight">Basic Information</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClasses}>Product Name</label>
                                            <div className="relative group">
                                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                <input 
                                                    required 
                                                    type="text" 
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. Premium Wireless Audio" 
                                                    className={inputClasses} 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>SKU</label>
                                                <div className="relative group">
                                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <input 
                                                        required 
                                                        type="text" 
                                                        value={sku}
                                                        onChange={(e) => setSku(e.target.value)}
                                                        placeholder="SKU-001" 
                                                        className={inputClasses} 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Barcode</label>
                                                <div className="relative group">
                                                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <input 
                                                        type="text" 
                                                        value={barcode}
                                                        onChange={(e) => setBarcode(e.target.value)}
                                                        placeholder="EAN-13" 
                                                        className={inputClasses} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>Category</label>
                                                <div className="relative group">
                                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <select 
                                                        value={categoryId}
                                                        onChange={(e) => {
                                                            setCategoryId(e.target.value);
                                                            setSubCategoryId('');
                                                        }}
                                                        className={`${inputClasses} appearance-none cursor-pointer font-bold`}
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={`${labelClasses} ${!categoryId ? 'opacity-40' : ''}`}>Subcategory</label>
                                                <div className="relative group">
                                                    <Layers className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${categoryId ? 'text-slate-300 group-focus-within:text-blue-500' : 'text-slate-200'}`} />
                                                    <select 
                                                        disabled={!categoryId}
                                                        value={subCategoryId}
                                                        onChange={(e) => setSubCategoryId(e.target.value)}
                                                        className={`${inputClasses} appearance-none font-bold ${categoryId ? 'cursor-pointer' : 'cursor-not-allowed opacity-40 bg-slate-50/50'}`}
                                                    >
                                                        <option value="">{categoryId ? 'Select Subcategory' : 'Pick Category first'}</option>
                                                        {categoryId && getDynamicSubcategories(categoryId).map(sub => (
                                                            <option key={sub} value={sub.toLowerCase()}>{sub}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-5 pt-2">
                                        <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-gray-100 tracking-tight">Pricing & Tax</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>Purchase Price</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs group-focus-within:text-blue-500 transition-colors">Rs</span>
                                                    <input 
                                                        required 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={purchasePrice}
                                                        onChange={(e) => setPurchasePrice(e.target.value)}
                                                        placeholder="0.00" 
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-500 text-sm" 
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Selling Price</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs group-focus-within:text-blue-500 transition-colors">Rs</span>
                                                    <input 
                                                        required 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={sellingPrice}
                                                        onChange={(e) => setSellingPrice(e.target.value)}
                                                        placeholder="0.00" 
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-gray-500 text-sm" 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClasses}>Tax Rate (%)</label>
                                                <div className="relative group">
                                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <select
                                                        value={taxPercentage}
                                                        onChange={(e) => setTaxPercentage(e.target.value)}
                                                        className={`${inputClasses} appearance-none cursor-pointer font-bold`}
                                                    >
                                                        <option value="0">No Tax</option>
                                                        <option value="5">5%</option>
                                                        <option value="10">10%</option>
                                                        <option value="15">15%</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClasses}>Default Discount (%)</label>
                                                <div className="relative group">
                                                    <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        max="100"
                                                        value={discountPercentage}
                                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                                        placeholder="0" 
                                                        className={inputClasses} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column: Inventory & Media */}
                            <div className="space-y-8">
                                <section>
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-gray-100 tracking-tight">Inventory Details</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClasses}>Opening Stock</label>
                                            <div className="relative group">
                                                <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                <input 
                                                    required 
                                                    type="number" 
                                                    value={initialStock}
                                                    onChange={(e) => setInitialStock(e.target.value)}
                                                    placeholder="0" 
                                                    className={inputClasses} 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClasses}>Low Level Alert</label>
                                            <div className="relative group">
                                                <Inbox className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                                <input 
                                                    required 
                                                    type="number" 
                                                    value={reorderLevel}
                                                    onChange={(e) => setReorderLevel(e.target.value)}
                                                    placeholder="10" 
                                                    className={inputClasses} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center gap-2 mb-5 pt-2">
                                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-gray-100 tracking-tight">Product Media</h3>
                                    </div>
                                    <div className="relative group h-48 border-2 border-dashed border-slate-100 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center bg-slate-50/30 dark:bg-gray-800/20 overflow-hidden transition-all hover:bg-slate-50 dark:hover:bg-gray-800/40">
                                        {imagePreview ? (
                                            <div className="relative w-full h-full group/image">
                                                <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                                                        className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-lg text-white transition-all transition-all duration-300"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                                                    <UploadCloud className="w-6 h-6" />
                                                </div>
                                                <h4 className="text-xs font-black text-slate-900 dark:text-gray-200">Click to upload</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1">Maximum size 2MB</p>
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleImageChange}
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                />
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>

                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-6 border-t border-slate-50 dark:border-gray-800 flex items-center justify-end gap-3 bg-white dark:bg-gray-900 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 rounded-xl font-bold text-xs hover:bg-slate-200 dark:hover:bg-gray-700 transition-all active:scale-95 tracking-wide"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-10 py-3 bg-indigo-900 text-white rounded-xl font-bold text-xs hover:bg-indigo-600 shadow-lg shadow-indigo-900/25 transition-all active:scale-95 disabled:opacity-50 tracking-wide"
                        >
                            {loading ? 'Creating Item...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
