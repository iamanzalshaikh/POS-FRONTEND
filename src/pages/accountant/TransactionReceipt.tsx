import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  ShoppingCart,
  RotateCcw,
  Calendar,
  User,
  CreditCard,
  Hash,
  Package,
} from 'lucide-react';
import { getSaleById } from '../../api/finance.api';
import type { SaleDetail } from '../../api/finance.api';
import { formatCurrency } from '@/utils/format';

const TransactionReceipt: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sale, setSale] = useState<SaleDetail | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setError('No transaction ID provided');
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await getSaleById(transactionId);

        let saleData: any = null;

        if (res.success) {
          const d = res.data as any;
          if (d?.data?.id) {
            saleData = d.data;
          } else if (d?.id) {
            saleData = d;
          } else if (typeof d === 'object' && d.data?.id) {
            saleData = d.data;
          }
        }

        // If this is a refund/reversal with no saleItems, fetch the linked original sale
        if (saleData?.saleItems?.length === 0 && saleData?.linkedSaleId) {
          const originalRes = await getSaleById(saleData.linkedSaleId);
          if (originalRes.success) {
            const od = originalRes.data as any;
            const originalSale = od?.data?.id ? od.data : od?.id ? od : od?.data?.data;
            if (originalSale?.saleItems?.length > 0) {
              saleData.saleItems = originalSale.saleItems;
            }
          }
        }

        if (saleData?.id) {
          setSale(saleData);
        } else {
          setError('Transaction not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-500">Loading transaction...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="animate-fade-in space-y-6">
        <button
          type="button"
          onClick={() => navigate('/accountant/transactions')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to ledger</span>
        </button>
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-red-600">{error || 'Transaction not found'}</p>
        </div>
      </div>
    );
  }

  const isRefund = sale.paymentStatus.toLowerCase() === 'refunded';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/accountant/transactions')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to ledger</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Printer size={16} />
          <span>Print</span>
        </button>
      </div>

      {/* Receipt Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden print:border-0 print:rounded-none print:shadow-none">
        {/* Status Banner */}
        <div className={`px-8 py-6 border-b border-slate-200 ${isRefund ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isRefund ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {isRefund ? (
                <RotateCcw size={24} className="text-red-600" />
              ) : (
                <ShoppingCart size={24} className="text-emerald-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isRefund ? 'Refund Receipt' : 'Sale Receipt'}
              </h2>
              <p className="text-sm text-slate-500">Transaction completed successfully</p>
            </div>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-8">
          {/* Transaction Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Hash size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice Number</p>
                  <p className="text-sm font-bold text-slate-900">#{sale.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Time</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(sale.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Method</p>
                  <p className="text-sm font-bold text-slate-900">{sale.paymentMethod}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                  <p className={`text-sm font-bold ${isRefund ? 'text-red-600' : 'text-emerald-600'}`}>
                    {sale.paymentStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <Package size={16} />
              Items
            </h3>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Qty
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sale.saleItems.map((item: any, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700">{item.product?.name || item.productName || 'Unknown Product'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-slate-900">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.price)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Subtotal</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.totalTax > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Tax</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(sale.totalTax)}</span>
              </div>
            )}
            {sale.discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Discount</span>
                <span className="text-sm font-bold text-red-600">-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border-2 border-blue-200">
              <span className="text-base font-black uppercase tracking-widest text-blue-900">Total</span>
              <span className="text-3xl font-black text-blue-600">{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceipt;
