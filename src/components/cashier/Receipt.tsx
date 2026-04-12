import React, { useEffect, useRef } from 'react';
import { Printer, X, CheckCircle } from 'lucide-react';

interface ReceiptItem {
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReceiptData {
  id: string;
  invoiceNumber?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  cashierName: string;
}

interface ReceiptProps {
  receipt: ReceiptData;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ receipt, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = receiptRef.current?.innerHTML || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.invoiceNumber || receipt.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 20px; margin: 0; font-weight: bold; }
          .header p { margin: 5px 0; font-size: 12px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .items { margin: 10px 0; }
          .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
          .item-name { flex: 1; }
          .totals { margin: 10px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
          .total-row.grand { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          .payment-method { text-align: center; font-size: 14px; font-weight: bold; margin: 10px 0; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${receiptHTML}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  useEffect(() => {
    // Auto-print on mount
    handlePrint();
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-white" size={20} />
            <h2 className="text-lg font-bold text-white">Sale Completed!</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-full transition-all">
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-6 max-h-[60vh] overflow-y-auto font-mono text-sm">
          {/* Store Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900">{receipt.storeName}</h1>
            <p className="text-xs text-slate-600 mt-1">{receipt.storeAddress}</p>
            <p className="text-xs text-slate-600">Phone: {receipt.storePhone}</p>
            <p className="text-xs text-slate-600">{receipt.storeEmail}</p>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Invoice Info */}
          <div className="flex justify-between text-xs text-slate-600 mb-3">
            <span>Invoice: {receipt.invoiceNumber || receipt.id}</span>
            <span>{new Date(receipt.createdAt).toLocaleString()}</span>
          </div>
          <div className="text-xs text-slate-600 mb-3">
            Cashier: {receipt.cashierName}
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Items */}
          <div className="space-y-2 mb-4">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <div className="flex-1">
                  <span className="font-semibold text-slate-900">{item.productName}</span>
                  <span className="text-slate-500 ml-1">x{item.quantity}</span>
                </div>
                <span className="font-semibold text-slate-900">Rs {item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span>Rs {receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Discount</span>
                <span>-Rs {receipt.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>
                Tax (GST)
                {receipt.subtotal > 0.0001 && receipt.tax > 0.0001
                  ? ` ${((receipt.tax / receipt.subtotal) * 100).toFixed(1)}%`
                  : ''}
              </span>
              <span>Rs {receipt.tax.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t-2 border-slate-800 my-3" />

          {/* Grand Total */}
          <div className="flex justify-between text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>Rs {receipt.total.toFixed(2)}</span>
          </div>

          {/* Payment Method */}
          <div className="mt-4 text-center">
            <span className="text-xs font-semibold text-slate-600">Payment Method:</span>
            <p className="text-sm font-bold text-emerald-600">{receipt.paymentMethod}</p>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Footer */}
          <div className="text-center text-xs text-slate-500">
            <p>Thank you for your purchase!</p>
            <p className="mt-1">Please keep this receipt for your records.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
          >
            <Printer size={18} />
            <span>Print Again</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
export type { ReceiptData, ReceiptItem };
