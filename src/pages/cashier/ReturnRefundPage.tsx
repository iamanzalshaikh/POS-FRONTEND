import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { getSaleByInvoiceNumber } from '../../api/sales.api';
import { refundSale } from '../../api/sales.api';
import PageHeader from '../../components/global-components/PageHeader';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: {
    name: string;
    sku?: string;
    barcode?: string;
  };
};

type Sale = {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  totalTax: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  isReversal: boolean;
  refundSaleId?: string;
  saleItems: SaleItem[];
  user: {
    name: string;
    email: string;
  };
  device: {
    deviceName: string;
  };
  store: {
    name: string;
    address: string;
    phone: string;
  };
};

type ReturnItem = {
  saleItemId: string;
  productId: string;
  productName: string;
  purchasedQuantity: number;
  unitPrice: number;
  returnQuantity: number;
  maxReturnQuantity: number;
};

const ReturnRefundPage: React.FC = () => {
  const navigate = useNavigate();

  // Search state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Sale data
  const [sale, setSale] = useState<Sale | null>(null);

  // Return items with quantities
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

  // Refund state
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle search by invoice number
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setSearchError('Please enter an invoice number');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSale(null);
    setReturnItems([]);
    setRefundReason('');
    setRefundError(null);
    setRefundSuccess(false);

    try {
      const response = await getSaleByInvoiceNumber(invoiceNumber.trim());
      const saleData: Sale = response?.data || response;

      if (!saleData?.id) {
        throw new Error('Invalid sale data received');
      }

      if (saleData.paymentStatus === 'REFUNDED') {
        setSearchError('This sale has already been refunded');
        setSale(saleData);
        return;
      }

      if (saleData.isReversal) {
        setSearchError('This is a refund transaction, not a sale');
        return;
      }

      setSale(saleData);

      // Initialize return items
      const items: ReturnItem[] = saleData.saleItems.map((item) => ({
        saleItemId: item.id,
        productId: item.productId,
        productName: item.product.name,
        purchasedQuantity: item.quantity,
        unitPrice: item.price,
        returnQuantity: item.quantity,
        maxReturnQuantity: item.quantity,
      }));
      setReturnItems(items);
    } catch (error: any) {
      setSearchError(error.response?.data?.message || 'Sale not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuantityChange = (saleItemId: string, delta: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.saleItemId === saleItemId) {
          const newQuantity = Math.max(0, Math.min(item.maxReturnQuantity, item.returnQuantity + delta));
          return { ...item, returnQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  const totalReturnAmount = returnItems.reduce((sum, item) => sum + item.returnQuantity * item.unitPrice, 0);
  const hasSelectedItems = returnItems.some((item) => item.returnQuantity > 0);

  const handleConfirmRefund = async () => {
    if (!sale) return;
    setIsProcessing(true);
    try {
      await refundSale(sale.id, refundReason);
      setRefundSuccess(true);
      setShowConfirmModal(false);
      setTimeout(() => {
        setSale(null);
        setInvoiceNumber('');
      }, 2000);
    } catch (error: any) {
      setRefundError(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Returns & Refunds"
        description="Process customer returns and credit notes"
        primaryAction={{
          label: "Terminal",
          icon: RotateCcw,
          onClick: () => navigate('/cashier/terminal')
        }}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Scan receipt or type invoice number..."
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full h-[60px] pl-14 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] text-sm font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="h-[60px] px-10 bg-slate-900 dark:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-slate-800 transition-all active:scale-95 shadow-xl flex items-center gap-3"
          >
            {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={18} />}
            Search
          </button>
        </form>

        {searchError && (
          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <AlertCircle className="text-rose-600 dark:text-rose-500" size={20} />
            <p className="text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">{searchError}</p>
          </div>
        )}
      </div>

      {sale && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Items</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Select items for return</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">INV# {sale.invoiceNumber}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-[9px] font-black uppercase text-slate-400 tracking-widest">Product</th>
                      <th className="px-8 py-4 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Qty</th>
                      <th className="px-8 py-4 text-right text-[9px] font-black uppercase text-slate-400 tracking-widest">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {returnItems.map((item) => (
                      <tr key={item.saleItemId} className={cn("transition-colors", item.returnQuantity > 0 ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.productName}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{formatCurrency(item.unitPrice)} / unit</p>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center justify-center gap-4">
                              <button onClick={() => handleQuantityChange(item.saleItemId, -1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all">-</button>
                              <span className="text-xs font-black w-4 text-center">{item.returnQuantity}</span>
                              <button onClick={() => handleQuantityChange(item.saleItemId, 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-all">+</button>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(item.returnQuantity * item.unitPrice)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 sticky top-24">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Refund Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(totalReturnAmount)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total Refund</span>
                  <span className="text-lg font-black text-blue-600 dark:text-blue-400">{formatCurrency(totalReturnAmount)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason for Return</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Defective item, change of mind..."
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none h-[120px]"
                />
              </div>

              {refundSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <p className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Refund Approved!</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!hasSelectedItems || !refundReason.trim() || isProcessing}
                  className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] hover:bg-blue-700 shadow-xl shadow-blue-400/20 transition-all active:scale-95 border border-blue-500 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Complete Refund"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowConfirmModal(false)} />
          
          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-sm mx-auto">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header Context */}
              <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border-2 border-blue-100 dark:border-blue-900/40">
                  <RotateCcw size={28} />
                </div>
                <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                  Confirm Transaction
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70 mt-2">
                  Refund Authorization Required
                </p>
              </div>

              {/* Content */}
              <div className="p-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-2 border-slate-100 dark:border-slate-800 mb-8 text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Refund amount</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums uppercase tracking-widest">
                    {formatCurrency(totalReturnAmount)}
                  </p>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center opacity-70">
                  This action will immediately adjust your active shift balance and update the inventory ledger. This process is irreversible.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isProcessing}
                  className="flex items-center justify-center py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Abort
                </button>
                <button
                  onClick={handleConfirmRefund}
                  disabled={isProcessing}
                  className="flex items-center justify-center py-4 bg-blue-600 text-white border-b-4 border-blue-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Authorize"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReturnRefundPage;
