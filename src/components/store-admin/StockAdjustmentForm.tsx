import { useState, useMemo } from 'react';
import { Search, Plus, Minus, CheckCircle, Package, Loader2 } from 'lucide-react';
import { adjustStock } from '@/api/inventory.api';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const StockAdjustmentForm = ({ products = [], onSuccess }: { products?: any[], onSuccess?: () => void }) => {
    const [quantity, setQuantity] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [changeType, setChangeType] = useState('OPENING_STOCK');
    const [notes, setNotes] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.barcode?.includes(searchQuery)
        );
    }, [products, searchQuery]);
    const handleSubmit = async () => {
        if (!selectedProduct) return toast.error('Please select a product', 'Missing Data');
        const currentStock = selectedProduct.inventoryStock?.totalQuantity || 0;
        
        // Calculate the difference between the target quantity and current stock
        let adjustedQuantity = quantity - currentStock;

        // Validation for negative stock
        const projectedStock = quantity;

        if (projectedStock < 0) {
            return toast.error(
                `Stock cannot be negative. Current: ${currentStock}, adjustment: ${adjustedQuantity}.`,
                'Stock Conflict'
            );
        }

        if (adjustedQuantity === 0) {
            return toast.error('No change detected in stock quantity.', 'Invalid Input');
        }

        try {
            setIsSubmitting(true);
            await adjustStock({
                productId: selectedProduct.id,
                changeType,
                quantity: adjustedQuantity,
                notes: notes.trim() || undefined,
                referenceId: referenceId.trim() || undefined
            });
            
            // Reset form
            setQuantity(0);
            setSearchQuery('');
            setSelectedProduct(null);
            setNotes('');
            setReferenceId('');
            
            toast.success('Stock level adjusted successfully', 'Success');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Adjustment failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'An unknown error occurred';
            toast.error(errorMsg, 'Adjustment Failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 lg:p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-800 space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                    <Package size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Stock Adjustment</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Inventory Transaction</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Selection */}
                <div className="space-y-6">
                    <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Search Product</label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder="Search by name or barcode..."
                                className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all text-gray-800"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                            />
                        </div>

                        {isDropdownOpen && searchQuery && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto animate-slide-up">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            role="button"
                                            tabIndex={0}
                                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between group transition-colors border-b border-gray-50 last:border-0 cursor-pointer outline-none focus:bg-gray-50"
                                            onClick={() => {
                                                setSelectedProduct(p);
                                                setSearchQuery(p.name);
                                                setIsDropdownOpen(false);
                                                setQuantity(p.inventoryStock?.totalQuantity || 0);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setSelectedProduct(p);
                                                    setSearchQuery(p.name);
                                                    setIsDropdownOpen(false);
                                                    setQuantity(p.inventoryStock?.totalQuantity || 0);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-800">{p.name}</span>
                                                    {p.inventoryStock && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                                            p.inventoryStock.totalQuantity > (p.reorderLevel || 10) 
                                                            ? 'bg-green-50 text-green-600' 
                                                            : 'bg-rose-50 text-rose-600'
                                                        }`}>
                                                            {p.inventoryStock.totalQuantity} IN STOCK
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono tracking-wider">{p.barcode || 'NO BARCODE'}</span>
                                            </div>
                                            <div 
                                                className="h-7 px-3 flex items-center justify-center bg-slate-100 text-slate-900 rounded-lg text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                SELECT
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-5 text-center text-gray-400 text-xs font-bold">No products found</div>
                                )}
                            </div>
                        )}
                        {selectedProduct && (
                            <div className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">
                                Selected: {selectedProduct.name}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Change Type</label>
                        <select 
                            value={changeType}
                            onChange={(e) => setChangeType(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 appearance-none"
                        >
                            <option value="PURCHASE">Purchase</option>
                            <option value="ADJUSTMENT">Adjustment</option>
                            <option value="DAMAGE">Damage</option>
                            <option value="RETURN">Return</option>
                            <option value="OPENING_STOCK">Opening Stock</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Reference ID (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. #PO-123456"
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all text-gray-800"
                            value={referenceId}
                            onChange={(e) => setReferenceId(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* Adjustment Details Column */}
                <div className="space-y-8">
                    <div className="space-y-6 text-center bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Stock Level Adjustment</label>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-2">Set target quantity</p>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <Button 
                                variant="outline"
                                onClick={() => setQuantity(quantity - 1)}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-90 border-2 border-slate-100 shadow-none p-0"
                            >
                                <Minus size={24} strokeWidth={3} />
                            </Button>
                            <div className="w-32 text-center flex flex-col items-center justify-center">
                                <span className={cn(
                                    "text-5xl font-black tracking-tighter tabular-nums leading-none",
                                    selectedProduct ? "text-blue-600 animate-pulse" : "text-gray-300"
                                )}>
                                    {quantity}
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2">New Total</span>
                            </div>
                            <Button 
                                variant="outline"
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 border-2 border-slate-100 shadow-none p-0"
                            >
                                <Plus size={24} strokeWidth={3} />
                            </Button>
                        </div>

                        {selectedProduct && (
                            <div className="mt-4 flex flex-col items-center">
                                <div className={cn(
                                    "px-6 py-3 rounded-2xl border-2 flex items-center gap-4 transition-all",
                                    (quantity - (selectedProduct.inventoryStock?.totalQuantity || 0)) < 0 
                                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                    : (quantity - (selectedProduct.inventoryStock?.totalQuantity || 0)) > 0
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                )}>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Adjustment Delta</div>
                                        <div className="text-sm font-black tracking-tighter">
                                            {quantity - (selectedProduct.inventoryStock?.totalQuantity || 0) > 0 ? '+' : ''}
                                            {quantity - (selectedProduct.inventoryStock?.totalQuantity || 0)} Units
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Adjustment Notes</label>
                        <textarea 
                            rows={4}
                            placeholder="Details about this stock movement..."
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 resize-none"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting || 
                            !selectedProduct || 
                            quantity < 0 ||
                            quantity === (selectedProduct.inventoryStock?.totalQuantity || 0)
                        }
                        className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[2px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} className="group-hover:rotate-12 transition-transform" />}
                        {isSubmitting ? 'Submitting...' : 'Adjust Stock Level'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustmentForm;
