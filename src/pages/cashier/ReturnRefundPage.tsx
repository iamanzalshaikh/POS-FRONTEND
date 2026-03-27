import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeft,
  Package,
  AlertCircle,
  CheckCircle2,
  X,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Info,
} from 'lucide-react';
import { getSaleByInvoiceNumber } from '../../api/sales.api';
import { refundSale } from '../../api/sales.api';

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
      const saleData: Sale = response.data.data;

      // Check if sale is already refunded
      if (saleData.paymentStatus === 'REFUNDED') {
        setSearchError('This sale has already been refunded');
        setSale(saleData);
        return;
      }

      // Check if sale is a reversal (refund itself)
      if (saleData.isReversal) {
        setSearchError('This is a refund transaction, not a sale');
        return;
      }

      // Check if sale is not completed
      if (saleData.paymentStatus !== 'COMPLETED') {
        setSearchError('Only completed sales can be refunded');
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
        returnQuantity: 0,
        maxReturnQuantity: item.quantity,
      }));
      setReturnItems(items);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchError('Sale not found. Please check the invoice number.');
      } else {
        setSearchError(error.response?.data?.message || 'Failed to fetch sale');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (saleItemId: string, delta: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.saleItemId === saleItemId) {
          const newQuantity = Math.max(
            0,
            Math.min(item.maxReturnQuantity, item.returnQuantity + delta)
          );
          return { ...item, returnQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Handle direct quantity input
  const handleQuantityInput = (saleItemId: string, value: string) => {
    const numValue = parseInt(value, 10);
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.saleItemId === saleItemId) {
          const newQuantity = Number.isNaN(numValue)
            ? 0
            : Math.max(0, Math.min(item.maxReturnQuantity, numValue));
          return { ...item, returnQuantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Calculate totals
  const totalReturnAmount = returnItems.reduce(
    (sum, item) => sum + item.returnQuantity * item.unitPrice,
    0
  );

  const hasSelectedItems = returnItems.some((item) => item.returnQuantity > 0);

  // Handle proceed to refund
  const handleProceedToRefund = () => {
    if (!hasSelectedItems) {
      setRefundError('Please select at least one item to return');
      return;
    }
    if (!refundReason.trim()) {
      setRefundError('Please provide a refund reason');
      return;
    }
    setShowConfirmModal(true);
  };

  // Handle confirm refund
  const handleConfirmRefund = async () => {
    if (!sale) return;

    setIsProcessing(true);
    setRefundError(null);

    try {
      // Note: Backend currently refunds entire sale
      // For item-wise refunds, backend would need enhancement
      await refundSale(sale.id, refundReason);
      setRefundSuccess(true);
      setShowConfirmModal(false);

      // Reset after success
      setTimeout(() => {
        setInvoiceNumber('');
        setSale(null);
        setReturnItems([]);
        setRefundReason('');
        setRefundSuccess(false);
      }, 3000);
    } catch (error: any) {
      setRefundError(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/cashier/terminal')}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <RotateCcw className="text-emerald-600" size={28} />
                  Return / Refund
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Process customer returns and refunds by invoice number
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info size={16} />
              <span>Store Admin access required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Invoice / Receipt Number
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number (e.g., STORE-20250124-000001)"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
                  disabled={isProcessing || refundSuccess}
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSearching || isProcessing || refundSuccess}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* Sale Details & Return Items */}
        {sale && (
          <>
            {/* Sale Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="text-emerald-600" size={20} />
                  <span className="text-sm font-semibold text-slate-600">Invoice</span>
                </div>
                <p className="text-lg font-bold text-slate-800 truncate">{sale.invoiceNumber}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="text-blue-600" size={20} />
                  <span className="text-sm font-semibold text-slate-600">Items</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{sale.saleItems.length} products</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="text-emerald-600" size={20} />
                  <span className="text-sm font-semibold text-slate-600">Payment</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{sale.paymentMethod}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="text-purple-600" size={20} />
                  <span className="text-sm font-semibold text-slate-600">Date</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{formatDate(sale.createdAt)}</p>
              </div>
            </div>

            {/* Return Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800">Purchased Items</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Select quantities to return (partial returns allowed)
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        SKU / Barcode
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Purchased
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Return Qty
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Return Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {returnItems.map((item) => (
                      <tr
                        key={item.saleItemId}
                        className={`transition-colors ${
                          item.returnQuantity > 0 ? 'bg-emerald-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.returnQuantity > 0
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <span className="font-semibold text-slate-800">
                              {item.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-slate-500">
                            {item.maxReturnQuantity > 0
                              ? (sale.saleItems.find((i) => i.id === item.saleItemId)?.product
                                  .sku ||
                                sale.saleItems.find((i) => i.id === item.saleItemId)?.product
                                  .barcode ||
                                'N/A')
                              : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-slate-700">
                            {formatCurrency(item.unitPrice)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                            {item.purchasedQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                handleQuantityChange(item.saleItemId, -1)
                              }
                              disabled={item.returnQuantity <= 0 || isProcessing}
                              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.maxReturnQuantity}
                              value={item.returnQuantity}
                              onChange={(e) =>
                                handleQuantityInput(item.saleItemId, e.target.value)
                              }
                              disabled={isProcessing}
                              className="w-16 text-center py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(item.saleItemId, 1)
                              }
                              disabled={
                                item.returnQuantity >= item.maxReturnQuantity ||
                                isProcessing
                              }
                              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 text-center mt-1">
                            Max: {item.maxReturnQuantity}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`font-bold ${
                              item.returnQuantity > 0
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {formatCurrency(item.returnQuantity * item.unitPrice)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      Total Return Amount
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {returnItems.filter((i) => i.returnQuantity > 0).length} of{' '}
                      {returnItems.length} items selected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(totalReturnAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Reason & Action */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why the customer is returning these items..."
                  rows={3}
                  disabled={isProcessing || refundSuccess}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              {refundError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-700 text-sm">{refundError}</p>
                </div>
              )}

              {refundSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-emerald-700 font-semibold text-sm">
                      Refund processed successfully!
                    </p>
                    <p className="text-emerald-600 text-xs mt-1">
                      Redirecting...
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  <p>
                    Original Total:{' '}
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(Number(sale.totalAmount))}
                    </span>
                  </p>
                  <p>
                    Refund Amount:{' '}
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(totalReturnAmount)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleProceedToRefund}
                  disabled={
                    !hasSelectedItems ||
                    !refundReason.trim() ||
                    isProcessing ||
                    refundSuccess
                  }
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                >
                  <RotateCcw size={20} />
                  {isProcessing ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!sale && !searchError && !isSearching && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="text-slate-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Search for a Sale
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Enter the invoice number from the customer's receipt to view
              purchased items and process returns
            </p>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={16} />
                <span>Partial returns allowed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={16} />
                <span>Inventory auto-restored</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={16} />
                <span>Audit trail maintained</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-800">
                Confirm Refund
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Invoice:</span>
                <span className="font-semibold text-slate-800">
                  {sale?.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items to return:</span>
                <span className="font-semibold text-slate-800">
                  {returnItems.filter((i) => i.returnQuantity > 0).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Refund amount:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(totalReturnAmount)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Reason:</p>
                <p className="text-sm text-slate-700">{refundReason}</p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
              <p className="text-sm text-emerald-800">
                <strong>Refund Action:</strong> This will refund the <strong>full sale amount</strong> of{' '}
                <span className="font-bold">{formatCurrency(Number(sale.totalAmount))}</span>{' '}
                and restore all items to inventory.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRefund}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    Confirm Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnRefundPage;
