import { X, Plus, DollarSign, Archive, Calendar, Tag } from 'lucide-react';
import { useState } from 'react';
import { addBatch } from '@/api/products.api';

interface AddStockModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    product: any;
}

export default function AddStockModal({ open, onClose, onSuccess, product }: AddStockModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form State
    const [purchasePrice, setPurchasePrice] = useState(product?.purchasePrice?.toString() || '0');
    const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice?.toString() || '0');
    const [quantityReceived, setQuantityReceived] = useState('0');
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    if (!open || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await addBatch(product.id, {
                purchasePrice,
                sellingPrice,
                quantityReceived,
                batchNumber,
                expiryDate: expiryDate || undefined
            });
            onSuccess?.();
            onClose();
            // Reset quantity only
            setQuantityReceived('0');
            setBatchNumber('');
            setExpiryDate('');
        } catch (error: any) {
            console.error("Failed to add batch:", error);
            setError(error.response?.data?.message || "Failed to add stock. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300 text-sm";
    const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-1.5 block";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="fixed inset-0 bg-black/30 backdrop-blur-sm animate-fade-in transition-all duration-300" 
                onClick={onClose}
            ></div>

            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-scale-up">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Add New Stock Batch</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{product.name}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl text-slate-400 transition-all active:scale-95 group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white dark:bg-gray-900">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 animate-fade-in text-rose-600 font-bold text-xs">
                            <X size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>New Purchase Price (Rs.)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01" 
                                    value={purchasePrice}
                                    onChange={(e) => setPurchasePrice(e.target.value)}
                                    className={inputClasses} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>New Selling Price (Rs.)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    required 
                                    type="number" 
                                    step="0.01" 
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    className={inputClasses} 
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={labelClasses}>Quantity to Add</label>
                        <div className="relative group">
                            <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                required 
                                type="number" 
                                value={quantityReceived}
                                onChange={(e) => setQuantityReceived(e.target.value)}
                                className={inputClasses} 
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Batch # (Optional)</label>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={batchNumber}
                                    onChange={(e) => setBatchNumber(e.target.value)}
                                    placeholder="AUG-202X-B1"
                                    className={inputClasses} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Expiry Date (Optional)</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    type="date" 
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className={inputClasses} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-3 bg-[#1E1B4B] text-white rounded-xl font-bold text-xs hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Adding Stock...' : <><Plus size={16} /> Add Stock</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
