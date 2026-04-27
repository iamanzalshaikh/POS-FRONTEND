import React from 'react';
import { Mail, MapPin, Phone, Building2, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/expense-utils';
import { formatInvoiceNumber } from '../../utils/format';

/**
 * THERMAL POS RECEIPT STANDARDS (80mm)
 * This exactly matches the styles in ReceiptPage.tsx
 */
const thermalPrintStyles = `
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    background: white !important;
    overflow: visible !important;
  }

  /* Override any h-screen or fixed heights in the app tree */
  div {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
  }

  /* Hide everything on the POS screen except this receipt */
  body * {
    visibility: hidden !important;
  }

  #direct-thermal-receipt, #direct-thermal-receipt * {
    visibility: visible !important;
  }

  #direct-thermal-receipt {
    width: 80mm !important;
    margin: 0 !important;
    padding: 2mm 3mm 0mm 3mm !important;
    display: block !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    box-sizing: border-box !important;
    break-after: avoid !important;
    page-break-after: avoid !important;
  }

  .print-hidden {
    display: none !important;
  }

  /* Format adjustments for 80mm strip */
  .receipt-table {
    font-size: 7pt !important;
    width: 100% !important;
    table-layout: fixed;
    margin-bottom: 2mm !important;
    border-collapse: collapse;
  }

  .receipt-table th {
    padding: 1.5mm 0.2mm !important;
    font-size: 6.5pt !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    border-bottom: 0.3mm dashed #000 !important;
    color: black !important;
  }

  .receipt-table td {
    padding: 1mm 0.2mm !important;
    word-wrap: break-word;
    font-size: 6.5pt !important;
    vertical-align: top !important;
    color: black !important;
  }

  /* Column widths for 80mm */
  .col-item { width: 38%; text-align: left; }
  .col-qty { width: 10%; text-align: center; }
  .col-price { width: 17%; text-align: right; }
  .col-gst { width: 15%; text-align: right; }
  .col-total { width: 20%; text-align: right; }

  .receipt-divider {
    border-top: 0.4mm dashed #000 !important;
    margin: 1.5mm 0 !important;
  }

  * {
    box-shadow: none !important;
    border-radius: 0 !important;
    color: black !important;
    background-color: white !important;
    -webkit-print-color-adjust: exact;
  }
}

@media screen {
  #direct-thermal-receipt {
    display: none;
  }
}
`;

// Helper formatting functions exactly from ReceiptPage.tsx
const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

function toFiniteNumber(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function lineItemGst(item: any, subtotal: number): number {
  const stored = toFiniteNumber(item.tax);
  if (stored !== null) return stored;
  const pct = toFiniteNumber(item.product?.taxPercentage ?? item.taxPercentage);
  if (pct !== null && pct > 0) return subtotal * (pct / 100);
  return 0;
}

/**
 * WEIGHTED AVERAGE LOGIC: Aggregates items by product for receipt display
 */
function aggregateReceiptItems(items: any[]): any[] {
  if (!items || items.length <= 1) return items;
  
  const grouped = new Map<string, any>();

  items.forEach((item) => {
    // Group by product identification
    const productId = item.productId || item.product?.id || item.productName || item.name || 'unknown';
    
    if (!grouped.has(productId)) {
      grouped.set(productId, {
        ...item,
        quantity: 0,
        subtotal: 0,
        tax: 0,
        discountAmount: 0,
        // We'll store the raw revenue (price * qty) to compute the weighted average later
        _revenueForAveraging: 0,
      });
    }

    const g = grouped.get(productId);
    const qty = Number(item.quantity || 0);
    const unitPrice = Number(item.price || item.unitPrice || 0);
    const discount = Number(item.discountAmount || 0);
    const tax = Number(item.tax || 0);
    // Explicit subtotal or derived
    const subtotal = Number(item.subtotal || (qty * unitPrice));

    g.quantity += qty;
    g.subtotal += subtotal;
    g.tax += tax;
    g.discountAmount += discount;
    g._revenueForAveraging += (qty * unitPrice);
  });

  return Array.from(grouped.values()).map(g => {
    // Calculate the weighted average price
    const averagePrice = g.quantity > 0 ? g._revenueForAveraging / g.quantity : 0;
    
    return {
      ...g,
      price: averagePrice,
      unitPrice: averagePrice,
    };
  });
}

interface ThermalReceiptProps {
  sale: any;
}

const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale }) => {
  const { user } = useAuthStore();

  if (!sale) return null;

  const invoiceNumber = sale.invoiceNumber || sale.tempId || 'N/A';
  const createdAt = sale.createdAt ? new Date(sale.createdAt) : new Date();
  const items = sale.saleItems || sale.items || [];

  return (
    <div id="direct-thermal-receipt" style={{ breakInside: 'avoid' }}>
      <style>{thermalPrintStyles}</style>
      <div className="bg-white" style={{ margin: 0, padding: 0 }}>
        {/* Store Info Header */}
        <div className="mb-4 pb-4 border-b-2 border-slate-300">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 w-16 h-16 flex items-center justify-center bg-transparent rounded-2xl overflow-hidden">
              {user?.store?.logoUrl ? (
                <img src={user.store.logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                  <Building2 size={32} />
                </div>
              )}
            </div>

            {user?.store ? (
              <>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.15em] mb-1" style={{ fontSize: '10pt' }}>
                  {user.store.name}
                </h2>
                <div className="space-y-0.5">
                  {user.store.address && (
                    <div className="flex items-center justify-center space-x-1">
                      <MapPin size={10} className="text-slate-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ fontSize: '6.5pt' }}>
                        {user.store.address}
                      </p>
                    </div>
                  )}
                  {user.store.phone && (
                    <div className="flex items-center justify-center space-x-1">
                      <Phone size={10} className="text-slate-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ fontSize: '6.5pt' }}>
                        {user.store.phone}
                      </p>
                    </div>
                  )}
                  {user.store.email && (
                    <div className="flex items-center justify-center space-x-1">
                      <Mail size={10} className="text-slate-500 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight" style={{ fontSize: '6.5pt' }}>
                        {user.store.email}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em]" style={{ fontSize: '12pt' }}>
                SALE RECEIPT
              </h2>
            )}
          </div>
        </div>

        <div className="receipt-divider" />

        <div className="mb-4 flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-widest" style={{ fontSize: '6.5pt' }}>
          <div>
            <div className="font-black text-slate-900">
              Invoice #{formatInvoiceNumber(invoiceNumber)}
            </div>
            <div className="mt-0.5 tracking-tight font-medium">{createdAt.toLocaleString()}</div>
          </div>
          {sale?.user && (
            <div className="text-right">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: '6.5pt' }}>
                Cashier
              </div>
              <div className="font-black text-slate-900">
                {sale?.user?.name || sale?.user?.email}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 text-[10px] uppercase font-bold text-slate-500 tracking-widest" style={{ fontSize: '6.5pt' }}>
          {sale?.device && (
            <div>
              <span className="font-black text-slate-400">Device:</span> {sale?.device?.deviceName}
            </div>
          )}
        </div>

        <div className="receipt-divider" />

        <table className="w-full text-xs receipt-table">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-y border-slate-200">
            <tr>
              <th className="px-3 py-3 col-item">Item</th>
              <th className="px-3 py-3 col-qty">Qty</th>
              <th className="px-3 py-3 col-price">Price</th>
              <th className="px-3 py-3 col-gst">GST</th>
              <th className="px-3 py-3 col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {aggregateReceiptItems(items).map((item: any, idx: number) => {
              const productName = item.productName || item.product?.name || item.name || 'Unknown Product';
              const unitPrice = Number(item.price || item.unitPrice || 0);
              const quantity = Number(item.quantity || 1);
              const subtotal = unitPrice * quantity;
              const gst = lineItemGst(item, subtotal);

              return (
                <tr key={idx} className="border-b border-slate-50 last:border-0">
                  <td className="px-3 py-2.5 col-item">
                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight" style={{ fontSize: '6.5pt' }}>
                      {productName}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center col-qty">
                    <span className="text-[11px] font-black text-slate-800 tabular-nums" style={{ fontSize: '6.5pt' }}>
                      {quantity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right col-price">
                    <span className="text-[11px] font-black text-slate-800 tabular-nums" style={{ fontSize: '6.5pt' }}>
                      {formatNumber(unitPrice)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right col-gst">
                    <span className="text-[10px] font-bold text-slate-500 tabular-nums" style={{ fontSize: '6pt' }}>
                      {formatNumber(gst)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right col-total">
                    <span className="text-[11px] font-black text-slate-900 tabular-nums" style={{ fontSize: '7pt' }}>
                      {formatNumber(subtotal)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="receipt-divider" />

        <div className="mt-6 space-y-3 border-t border-dashed border-slate-200 pt-4 text-xs text-slate-600">
          {(() => {
            const totalDiscount = toFiniteNumber(sale?.discountAmount) ?? 0;
            const serverSub = toFiniteNumber(sale?.subtotal);
            const serverTax = toFiniteNumber(sale?.totalTax);
            const serverGrand = toFiniteNumber(sale?.totalAmount);

            let totalSubtotal = 0;
            let totalGST = 0;
            let grandTotal = 0;

            if (serverSub !== null && serverTax !== null && serverGrand !== null) {
              totalSubtotal = serverSub;
              totalGST = serverTax;
              grandTotal = serverGrand;
            } else {
              items.forEach((item: any) => {
                const unitPrice = Number(item.price || item.unitPrice || 0);
                const quantity = Number(item.quantity || 1);
                const subtotal = unitPrice * quantity;
                totalSubtotal += subtotal;
                totalGST += lineItemGst(item, subtotal);
              });
              grandTotal = totalSubtotal - totalDiscount;
            }

            const gstLabelPct = Math.abs(totalSubtotal) > 0.0001
              ? Math.round((totalGST / totalSubtotal) * 1000) / 10
              : null;

            return (
              <>
                <div className="flex justify-between font-black text-[11px] text-slate-600 uppercase tracking-widest" style={{ fontSize: '7.5pt' }}>
                  <span>Total Subtotal:</span>
                  <span className="tabular-nums">{formatNumber(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between font-black text-[11px] text-slate-600 uppercase tracking-widest" style={{ fontSize: '7.5pt' }}>
                  <span>
                    Total GST {gstLabelPct !== null && gstLabelPct > 0 ? ` (${gstLabelPct}%)` : ''}:
                  </span>
                  <span className="tabular-nums">{formatNumber(totalGST)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between font-black text-[11px] text-rose-600 uppercase tracking-widest" style={{ fontSize: '7.5pt' }}>
                    <span>Total Discount:</span>
                    <span className="tabular-nums">-{formatNumber(totalDiscount)}</span>
                  </div>
                )}
                <div className="border-t-[0.4mm] border-dashed border-black pt-3 flex justify-between font-black text-lg text-slate-900 uppercase tracking-tighter" style={{ fontSize: '11pt' }}>
                  <span>GRAND TOTAL:</span>
                  <span className="tabular-nums">{formatNumber(grandTotal)}</span>
                </div>

                {sale?.paymentMethod === 'CASH' && (
                  <div className="mt-4 pt-3 border-t border-black/5 space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-slate-400" style={{ fontSize: '7pt' }}>
                      <span>Amount Paid</span>
                      <span className="text-slate-900 tabular-nums">RS {formatNumber(toFiniteNumber(sale?.receivedAmount) ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-extrabold text-slate-900" style={{ fontSize: '8pt' }}>
                      <span>Change</span>
                      <span className="tabular-nums">RS {formatNumber(toFiniteNumber(sale?.changeAmount) ?? 0)}</span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="receipt-divider" />

        {sale?.paymentMethod && (
          <div className="mt-4 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-700">Payment Method:</span> {sale?.paymentMethod}
            </div>
            {sale?.paymentStatus && (
              <div>
                <span className="font-semibold text-slate-700">Payment Status:</span> {sale?.paymentStatus}
              </div>
            )}
          </div>
        )}

        <div className="receipt-divider" />

        {/* Footer */}
        <div className="mt-4 pt-2 text-center" style={{ breakInside: 'avoid' }}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] whitespace-nowrap" style={{ fontSize: '6.5pt' }}>
            Software by <span className="text-slate-900">Elsa DevOps Technology</span>
          </p>
          <div className="mt-1 text-[9px] font-bold text-slate-400 flex justify-center gap-3" style={{ fontSize: '6pt' }}>
            <span className="inline-flex items-center gap-1">
              <Phone size={10} className="inline opacity-50" /> 03128289654
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe size={10} className="inline opacity-50" /> www.elsadevops.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalReceipt;
