import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Printer, Mail, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { getSaleById } from '../../api/sales.api';
import { formatCurrency } from '@/utils/format';

type ReceiptStatus = 'COMPLETED' | 'PENDING_SYNC';

const ReceiptPage: React.FC = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [sale, setSale] = React.useState<any>(location.state?.sale || null);
  const [status] = React.useState<ReceiptStatus>(
    (location.state?.status as ReceiptStatus) || 'COMPLETED'
  );
  const [email, setEmail] = React.useState('');
  const [emailMessage, setEmailMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSale = async () => {
      if (!saleId) return;
      try {
        console.log('📡 [ReceiptPage] Fetching sale from API:', saleId);
        const res = await getSaleById(saleId);
        console.log('🔍 [ReceiptPage] Full API response:', res);
        console.log('🔍 [ReceiptPage] res.data:', res.data);
        console.log('🔍 [ReceiptPage] res.data.data:', res.data.data);
        console.log('🔍 [ReceiptPage] res.data.data.store:', res.data.data?.store);
        if (res.data?.success && res.data.data) {
          console.log('✅ [ReceiptPage] Sale fetched:', res.data.data);
          setSale(res.data.data);
        }
      } catch (err: any) {
        console.error('❌ [ReceiptPage] Error fetching sale:', err);
        // Fallback to location state if API fails
        if (location.state?.sale) {
          setSale(location.state.sale);
        }
      }
    };
    fetchSale();
  }, [saleId]);

  // Debug: Log sale data when it changes
  React.useEffect(() => {
    if (sale) {
      console.log('📦 [ReceiptPage] Current sale data:', {
        saleId: sale.id,
        invoiceNumber: sale.invoiceNumber,
        saleItemsCount: sale.saleItems?.length || 0,
        saleItems: sale.saleItems,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        totalTax: sale.totalTax,
        totalAmount: sale.totalAmount,
        store: sale.store,
      });
    }
  }, [sale]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmailReceipt = async () => {
    // Email receipt endpoint is not implemented in backend; show friendly message
    if (!email) return;
    setEmailMessage('Email receipts are not configured on this server.');
  };

  const invoiceNumber =
    sale?.invoiceNumber || sale?.tempId || saleId || 'N/A';

  const createdAt = sale?.createdAt
    ? new Date(sale.createdAt)
    : new Date();

  // Backend returns saleItems with product info
  const items = sale?.saleItems || sale?.items || [];
  const totals = sale?.totals || {};

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">
            Sale Receipt
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Thank you for your purchase.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div
            className={`inline-flex items-center space-x-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
              status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {status === 'COMPLETED' ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock size={14} />
            )}
            <span>
              {status === 'COMPLETED' ? 'Completed' : 'Pending Sync'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0">
        <section className="md:col-span-2 border-r border-slate-200 p-6 print:p-4">
          {/* Store Info Header */}
          {sale?.store && (
            <div className="mb-4 pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">{sale.store.name}</h2>
              <p className="text-xs text-slate-600 mt-1">{sale.store.address}</p>
              {sale.store.phone && (
                <p className="text-xs text-slate-600">Phone: {sale.store.phone}</p>
              )}
              {sale.store.email && (
                <p className="text-xs text-slate-600">Email: {sale.store.email}</p>
              )}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between text-xs text-slate-600">
            <div>
              <div className="font-bold text-slate-800">
                Invoice #{invoiceNumber}
              </div>
              <div>{createdAt.toLocaleString()}</div>
            </div>
            {sale?.user && (
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Cashier
                </div>
                <div className="font-semibold text-slate-800">
                  {sale.user.name || sale.user.email}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 text-xs text-slate-600">
            {sale?.device && (
              <div>
                <span className="font-semibold text-slate-700">
                  Device:
                </span>{' '}
                {sale.device.deviceName}
              </div>
            )}
          </div>

          <table className="w-full text-xs border-t border-b border-slate-200">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-center w-12">Qty</th>
                <th className="px-2 py-2 text-right w-16">Unit Price</th>
                <th className="px-2 py-2 text-right w-16">Subtotal</th>
                <th className="px-2 py-2 text-right w-14">GST (18%)</th>
                <th className="px-2 py-2 text-right w-14">Discount</th>
                <th className="px-2 py-2 text-right w-16">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No line items available.
                  </td>
                </tr>
              ) : (
                (() => {
                  // Calculate totals for distribution
                  let totalSubtotal = 0;
                  let totalGST = 0;
                  let totalDiscount = sale?.discountAmount || 0;
                  let totalLineAmount = 0;

                  // Calculate per-item values
                  const itemDetails = items.map((item: any) => {
                    const productName = item.product?.name || item.name || 'Unknown Product';
                    const unitPrice = Number(item.price || item.unitPrice || 0);
                    const quantity = Number(item.quantity || 1);
                    const subtotal = unitPrice * quantity;
                    const taxRate = Number(item.product?.taxPercentage || item.taxPercentage || 18) / 100;
                    const gst = subtotal * taxRate;
                    
                    totalSubtotal += subtotal;
                    totalGST += gst;
                    
                    return { productName, unitPrice, quantity, subtotal, gst, taxRate };
                  });

                  // Distribute discount proportionally
                  const discountPercentage = totalSubtotal > 0 ? (totalDiscount / totalSubtotal) : 0;
                  
                  return itemDetails.map((details: any, idx: number) => {
                    const itemDiscount = details.subtotal * discountPercentage;
                    const lineTotal = details.subtotal + details.gst - itemDiscount;
                    totalLineAmount += lineTotal;

                    console.log(`🧾 Receipt item ${idx}:`, {
                      productName: details.productName,
                      unitPrice: details.unitPrice,
                      quantity: details.quantity,
                      subtotal: details.subtotal,
                      gst: details.gst,
                      discount: itemDiscount,
                      lineTotal,
                    });

                    return (
                      <tr
                        key={idx}
                        className="border-t border-slate-100"
                      >
                        <td className="px-2 py-2">
                          <div className="font-semibold text-slate-800">
                            {details.productName}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {details.quantity}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(details.unitPrice)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(details.subtotal)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(details.gst)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {formatCurrency(itemDiscount)}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-slate-900">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>

          <div className="mt-6 space-y-3 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-600">
            {(() => {
              // Calculate combined totals
              let totalSubtotal = 0;
              let totalGST = 0;
              let totalDiscount = Number(sale?.discountAmount) || 0;
              let grandTotal = 0;

              items.forEach((item: any) => {
                const unitPrice = Number(item.price || item.unitPrice || 0);
                const quantity = Number(item.quantity || 1);
                const subtotal = unitPrice * quantity;
                const taxRate = Number(item.product?.taxPercentage || item.taxPercentage || 18) / 100;
                const gst = subtotal * taxRate;
                
                totalSubtotal += subtotal;
                totalGST += gst;
              });

              // Distribute discount proportionally
              const discountPercentage = totalSubtotal > 0 ? (totalDiscount / totalSubtotal) : 0;
              
              // Calculate line totals with distributed discount
              items.forEach((item: any) => {
                const unitPrice = Number(item.price || item.unitPrice || 0);
                const quantity = Number(item.quantity || 1);
                const subtotal = unitPrice * quantity;
                const taxRate = Number(item.product?.taxPercentage || item.taxPercentage || 18) / 100;
                const gst = subtotal * taxRate;
                const itemDiscount = subtotal * discountPercentage;
                const lineTotal = subtotal + gst - itemDiscount;
                
                grandTotal += lineTotal;
              });

              return (
                <>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Total Subtotal:</span>
                    <span>{formatCurrency(totalSubtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>Total GST (18%):</span>
                    <span>{formatCurrency(totalGST)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>Total Discount:</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between font-black text-base text-slate-900">
                    <span>GRAND TOTAL:</span>
                    <span className="text-emerald-600">{formatCurrency(grandTotal)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {sale?.paymentMethod && (
            <div className="mt-4 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">
                  Payment Method:
                </span>{' '}
                {sale.paymentMethod}
              </div>
              {sale?.paymentStatus && (
                <div>
                  <span className="font-semibold text-slate-700">
                    Payment Status:
                  </span>{' '}
                  {sale.paymentStatus}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="p-6 flex flex-col space-y-4">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-black"
          >
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>

          <div className="border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
              <Mail size={14} />
              <span>Email Receipt</span>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
            />
            <button
              type="button"
              disabled={!email}
              onClick={handleEmailReceipt}
              className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-900 disabled:bg-emerald-400"
            >
              Send Email
            </button>
            {emailMessage && (
              <div className="text-[11px] text-slate-600">
                {emailMessage}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/cashier/shift-summary')}
            className="inline-flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50"
          >
            <Clock size={14} />
            <span>Shift Summary</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/cashier/terminal')}
            className="mt-auto inline-flex items-center justify-center space-x-2 rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-800 hover:bg-emerald-100"
          >
            <ArrowLeft size={14} />
            <span>New Sale</span>
          </button>
        </aside>
      </div>
    </div>
  );
};

export default ReceiptPage;

