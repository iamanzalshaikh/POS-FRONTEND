import { X, Package, Tag, Archive, UploadCloud, Info, DollarSign, CheckCircle2, Percent, Scale } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createPortal } from 'react-dom';
import { createProduct } from '@/api/products.api';
import { getCategories } from '@/api/category.api';
import { toast } from '@/lib/toast';

const GST_PRESETS = [18] as const;

const UNIT_TYPES = [
  { value: 'PIECE', label: 'Piece / Unit' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'ML', label: 'Millilitre (ML)' },
  { value: 'LITER', label: 'Litre' },
  { value: 'BOX', label: 'Box' },
] as const;

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddProductModal({ open, onClose, onSuccess }: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('18');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [initialStock, setInitialStock] = useState('0');
  const [reorderLevel, setReorderLevel] = useState('10');
  const [unitType, setUnitType] = useState<string>('PIECE');
  const [unitQuantity, setUnitQuantity] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      void fetchCategories();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data?.data || res.data || []);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setCategoryId('');
    setDescription('');
    setPurchasePrice('');
    setSellingPrice('');
    setTaxPercentage('18');
    setDiscountPercentage('0');
    setInitialStock('0');
    setReorderLevel('10');
    setUnitType('PIECE');
    setUnitQuantity('');
    setImageFile(null);
    setImagePreview('');
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
    formData.append('name', name.trim());
    formData.append('sku', sku.trim());
    formData.append('barcode', barcode.trim());
    formData.append('categoryId', categoryId);
    formData.append('purchasePrice', purchasePrice);
    formData.append('sellingPrice', sellingPrice);
    formData.append('taxPercentage', taxPercentage);
    formData.append('discountPercentage', discountPercentage);
    formData.append('initialStock', initialStock);
    formData.append('reorderLevel', reorderLevel);
    formData.append('unitType', unitType);
    if (description.trim()) formData.append('description', description.trim());
    const uq = unitQuantity.trim();
    if (uq !== '') formData.append('unitQuantity', uq);

    if (imageFile) formData.append('image', imageFile);

    try {
      await createProduct(formData);
      toast.success('Product created successfully', "Inventory Updated");
      onSuccess?.();
      handleClose();
      resetForm();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const errorMsg = msg || 'Failed to save product.';
      setError(errorMsg);
      toast.error(errorMsg, "Action Failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white';
  const labelClass = 'text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
        aria-hidden
      />

      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Package size={20} />
            </div>
            <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
              Add New Product
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
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

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                <Tag size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter product name"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelClass}>
                      SKU <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="SKU-001"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Barcode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="EAN / internal code"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notes for staff or receipt…"
                    rows={2}
                    className={`${inputClass} resize-none min-h-[72px]`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="">Select category (leaf)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium">
                    Products must use a leaf category (no subcategories under it).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                <DollarSign size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Pricing</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>
                    Purchase cost (Rs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>
                    Selling price (Rs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className={`${inputClass} text-blue-600 dark:text-blue-400 font-bold`}
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      Calculated GST (18%): Rs {((Number(sellingPrice) || 0) * 0.18).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Percent size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">GST / Sales tax</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Percent added on top of the selling price at checkout (same rate is stored on the opening stock batch).
                </p>
                <div className="flex flex-wrap gap-2">
                  {GST_PRESETS.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={taxPercentage === String(p) ? "default" : "outline"}
                      onClick={() => setTaxPercentage(String(p))}
                      className={cn(
                        "px-3 py-1.5 h-8 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all",
                        taxPercentage === String(p)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'
                      )}
                    >
                      {p}%
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Tax rate (%)</label>
                  <input
                    readOnly
                    type="number"
                    value={taxPercentage}
                    className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Line discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-[9px] text-slate-500">Default product discount; POS can still apply cart discounts.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                <Scale size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Unit (optional)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>Unit type</label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className={`${inputClass} appearance-none cursor-pointer`}
                  >
                    {UNIT_TYPES.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Qty per unit (e.g. 500 for 500ml)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={unitQuantity}
                    onChange={(e) => setUnitQuantity(e.target.value)}
                    placeholder="Leave blank if not used"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                <Archive size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Stock &amp; image</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>Initial stock</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Reorder alert at</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="relative group h-[140px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/50 overflow-hidden">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-all active:scale-95"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <UploadCloud size={28} strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-widest mt-2">Upload product image</p>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 shrink-0 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-white dark:bg-slate-900">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Saving…</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Save product</span>
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
