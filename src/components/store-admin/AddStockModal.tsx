import { X, Plus, Archive, Calendar, Tag, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
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
    const [purchasePrice, setPurchasePrice] = useState('0');
    const [sellingPrice, setSellingPrice] = useState('0');
    const [quantityReceived, setQuantityReceived] = useState('0');
    const [batchNumber, setBatchNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            if (product) {
                setPurchasePrice(product.purchasePrice?.toString() || '0');
                setSellingPrice(product.sellingPrice?.toString() || '0');
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [open, product]);

    if (!open || !product) return null;

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const currentStock = product.inventoryStock?.totalQuantity || 0;
        const totalStock = currentStock + Number(quantityReceived);

        if (totalStock > 18) {
            setError(`Total stock cannot exceed 18 units. Current: ${currentStock}, adding ${quantityReceived} would result in ${totalStock}.`);
            setLoading(false);
            return;
        }

        try {
            await addBatch(product.id, {
                purchasePrice,
                sellingPrice,
                quantityReceived,
                batchNumber,
                expiryDate: expiryDate || undefined
            });
            onSuccess?.();
            handleClose();
            setQuantityReceived('0');
            setBatchNumber('');
            setExpiryDate('');
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to add stock.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden uppercase">
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" 
                onClick={handleClose}
            ></div>

            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-white/5 dark:border-white/10">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Replenish Stock</h2>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Batch Registry: {product.name}</p>
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

                    <div className="grid grid-cols-2 gap-6">
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantity Received</label>
                        <div className="relative group">
                            <Archive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                            <input required type="number" value={quantityReceived} onChange={e => setQuantityReceived(e.target.value)} min="1" max={Math.max(0, 18 - (product.inventoryStock?.totalQuantity || 0))} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-black tabular-nums text-slate-900 dark:text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Batch Identifier</label>
                            <div className="relative group">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                <input type="text" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="BATCH-ID" className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 shrink-0">
                        <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleClose} 
                            className="flex-1 h-14 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-none"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authorizing...</span>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    Commit Batch
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
