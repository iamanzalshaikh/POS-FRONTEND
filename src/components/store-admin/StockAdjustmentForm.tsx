import { useState, useMemo } from 'react';
import { Search, Plus, Minus, CheckCircle, Package, Loader2 } from 'lucide-react';
import { adjustStock } from '@/api/inventory.api';
import { getSuppliers } from '@/api/suppliers.api';
import { getProductById } from '@/api/products.api';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const StockAdjustmentForm = ({ products = [], onSuccess }: { products?: any[], onSuccess?: () => void }) => {
    const [quantity, setQuantity] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [changeType, setChangeType] = useState('OPENING_STOCK');
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const { data: suppliersRes } = useQuery({
        queryKey: ['suppliers', 'active'],
        queryFn: () => getSuppliers({ activeOnly: true }),
    });

    const suppliers = useMemo(() => {
        const raw = suppliersRes?.data?.data || suppliersRes?.data;
        return Array.isArray(raw) ? raw : [];
    }, [suppliersRes]);

    const showSupplierSelect = changeType === 'DAMAGE' || changeType === 'RETURN';

    const filteredProducts = useMemo(() => {
        return products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            p.barcode?.includes(searchQuery)
        );
    }, [products, searchQuery]);

    const handleProductSelect = async (p: any) => {
        setSelectedProduct(p);
        setSearchQuery(p.name);
        setIsDropdownOpen(false);
        setQuantity(p.inventoryStock?.totalQuantity || 0);
        setSelectedBatch(null);
        setProductDetails(null);

        // Fetch full details for batches
        setIsFetchingDetails(true);
        try {
            const res = await getProductById(p.id);
            if (res.data?.success) {
                const fullProduct = res.data.data;
                setProductDetails(fullProduct);
                
                // Auto-detect last supplier from batches or product
                const latestBatch = fullProduct.activeBatches?.[fullProduct.activeBatches.length - 1];
                if (latestBatch?.supplier?.id && latestBatch.supplier.id !== 'OPENING') {
                    setSelectedSupplierId(latestBatch.supplier.id);
                } else {
                    const lastSupId = p.supplierPurchaseItems?.[0]?.purchase?.supplierId;
                    if (lastSupId) setSelectedSupplierId(lastSupId);
                }
            }
        } catch (err) {
            console.error("Failed to fetch product details:", err);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedProduct) return toast.error('Please select a product', 'Missing Data');
        
        const currentEntityStock = selectedBatch 
            ? selectedBatch.quantityRemaining 
            : (selectedProduct.inventoryStock?.totalQuantity || 0);
        
        // Calculate the difference relative to what the user sees on the counter
        const adjustedQuantity = quantity - currentEntityStock;
        
        // If we selected a specific batch, we are adjusting THAT batch.
        // The quantity slider shows the GLOBAL total, but we want to know 
        // how much is being removed from the specific batch.
        
        // Actually, if a batch is selected, the slider should probably show that batch's quantity?
        // No, usually users think in terms of total stock.
        // But the user said: "I select the supplier their quantity etc"
        
        // Let's make it so if a batch is selected, the 'Quantity' slider/input adjusts THAT batch's quantity.
        // Or better: when they select a batch, we show the batch quantity and they adjust it.

        // Validation for quantity limit
        const projectedStock = quantity;

        if (projectedStock < 0) {
            return toast.error(
                `Stock cannot be negative. Current: ${currentEntityStock}, adjustment: ${adjustedQuantity}.`,
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
                referenceId: referenceId.trim() || undefined,
                supplierId: showSupplierSelect ? selectedSupplierId : undefined,
                batchId: selectedBatch?.id
            });
            
            // Reset form
            setQuantity(0);
            setSearchQuery('');
            setSelectedProduct(null);
            setProductDetails(null);
            setSelectedBatch(null);
            setNotes('');
            setReferenceId('');
            setSelectedSupplierId('');
            
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
                                    const val = e.target.value;
                                    setSearchQuery(val);
                                    setIsDropdownOpen(true);
                                    if (!val) {
                                        setSelectedProduct(null);
                                        setProductDetails(null);
                                        setSelectedBatch(null);
                                        setQuantity(0);
                                    }
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
                                            onClick={() => handleProductSelect(p)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    handleProductSelect(p);
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
                            <div className="flex flex-wrap gap-2 mt-2">
                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full w-fit">
                                    Selected: {selectedProduct.name}
                                </div>
                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full w-fit border border-slate-200">
                                    Total Global Stock: {selectedProduct.inventoryStock?.totalQuantity || 0}
                                </div>
                                {selectedBatch && (
                                    <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100">
                                        Batch from: {selectedBatch.supplier?.name || 'N/A'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Batch Selection Table */}
                    {(isFetchingDetails || (productDetails && productDetails.activeBatches?.length > 0)) && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Batch/Supplier</label>
                                {isFetchingDetails && <Loader2 size={12} className="animate-spin text-blue-500" />}
                            </div>
                            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                <Table>
                                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest pl-6">Supplier</TableHead>
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest text-center">Date</TableHead>
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest text-center">Price</TableHead>
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest text-right pr-6">Stock</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isFetchingDetails ? (
                                            Array(3).fill(0).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="py-4 pl-6"><Skeleton className="h-3 w-24" /></TableCell>
                                                    <TableCell className="py-4"><Skeleton className="h-3 w-20 mx-auto" /></TableCell>
                                                    <TableCell className="py-4"><Skeleton className="h-3 w-16 mx-auto" /></TableCell>
                                                    <TableCell className="py-4 pr-6 text-right"><Skeleton className="h-5 w-8 ml-auto rounded-lg" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : productDetails?.activeBatches?.map((batch: any) => (
                                            <TableRow 
                                                key={batch.id} 
                                                className={cn(
                                                    "cursor-pointer transition-all border-slate-50 dark:border-slate-800",
                                                    selectedBatch?.id === batch.id 
                                                        ? "bg-blue-50/70 dark:bg-blue-900/30" 
                                                        : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                                                )}
                                                onClick={() => {
                                                    setSelectedBatch(batch);
                                                    setQuantity(batch.quantityRemaining);
                                                    if (batch.supplier?.id && batch.supplier.id !== 'OPENING') {
                                                        setSelectedSupplierId(batch.supplier.id);
                                                    }
                                                }}
                                            >
                                                <TableCell className="py-4 pl-6 relative">
                                                    {selectedBatch?.id === batch.id && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                                                    )}
                                                    <p className={cn(
                                                        "text-[10px] font-bold uppercase truncate max-w-[150px] transition-colors",
                                                        selectedBatch?.id === batch.id ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                                                    )}>
                                                        {batch.supplier?.name || 'Opening Stock'}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="py-4 text-[10px] font-semibold text-slate-500 text-center">
                                                    {format(new Date(batch.createdAt), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="py-4 text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">
                                                    RS {batch.purchasePrice || 0}
                                                </TableCell>
                                                <TableCell className="py-4 text-right pr-6">
                                                    <span className={cn(
                                                        "text-[10px] font-black tabular-nums px-2.5 py-1 rounded-lg transition-all",
                                                        selectedBatch?.id === batch.id
                                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                            : (batch.quantityRemaining > 5 ? "bg-slate-100 text-slate-600 dark:bg-slate-800" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30")
                                                    )}>
                                                        {batch.quantityRemaining}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

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

                    {showSupplierSelect && (
                        <div className="space-y-2 animate-slide-up">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Link to Supplier (Required for Returns)</label>
                            <select 
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 appearance-none"
                            >
                                <option value="">Select Supplier...</option>
                                {suppliers.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <p className="text-[9px] text-blue-500 font-bold px-1 italic">
                                Note: This will add the value of returned stock to the supplier's pending return card.
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Adjustment Details Column */}
                <div className="space-y-8">
                    <div className="space-y-6 text-center bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Stock Level Adjustment</label>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest -mt-2">Set target quantity</p>
                        <div className="flex items-center justify-center gap-6 mt-4">
                            <Button 
                                variant="outline"
                                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                                disabled={quantity <= 0}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-90 border-2 border-slate-100 shadow-none p-0 disabled:opacity-30 disabled:cursor-not-allowed"
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
                                onClick={() => setQuantity(prev => prev + 1)}
                                disabled={!selectedProduct || (selectedBatch ? quantity >= selectedBatch.quantityRemaining : false)}
                                className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2 border-slate-100 shadow-none p-0 disabled:opacity-30 disabled:cursor-not-allowed",
                                    (!selectedProduct || (selectedBatch ? quantity >= selectedBatch.quantityRemaining : false))
                                    ? "text-slate-200 cursor-not-allowed opacity-50"
                                    : "text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                                )}
                            >
                                <Plus size={24} strokeWidth={3} />
                            </Button>
                        </div>

                        {selectedProduct && (
                            <div className="mt-4 flex flex-col items-center">
                                <div className={cn(
                                    "px-6 py-3 rounded-2xl border-2 flex items-center gap-4 transition-all",
                                    (quantity - (selectedBatch ? selectedBatch.quantityRemaining : (selectedProduct.inventoryStock?.totalQuantity || 0))) < 0 
                                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                                    : (quantity - (selectedBatch ? selectedBatch.quantityRemaining : (selectedProduct.inventoryStock?.totalQuantity || 0))) > 0
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                )}>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Adjustment Delta</div>
                                        <div className="text-sm font-black tracking-tighter">
                                            {(quantity - (selectedBatch ? selectedBatch.quantityRemaining : (selectedProduct.inventoryStock?.totalQuantity || 0))) > 0 ? '+' : ''}
                                            {quantity - (selectedBatch ? selectedBatch.quantityRemaining : (selectedProduct.inventoryStock?.totalQuantity || 0))} Units
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
                            quantity === (selectedBatch ? selectedBatch.quantityRemaining : (selectedProduct.inventoryStock?.totalQuantity || 0)) ||
                            (showSupplierSelect && !selectedSupplierId)
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
