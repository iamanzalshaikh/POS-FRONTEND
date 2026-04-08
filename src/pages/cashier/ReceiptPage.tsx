import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Printer, Mail, CheckCircle2, Clock, ArrowLeft, WifiOff, RefreshCw, MapPin, Phone, Building2 } from 'lucide-react';
import { getSaleById } from '../../api/sales.api';
import { offlineStorage } from '../../services/offline-storage.service';
import { offlineSync } from '../../services/offline-sync.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuthStore } from '../../store/useAuthStore';

type ReceiptStatus = 'COMPLETED' | 'PENDING_SYNC';
type SaleData = {
  id?: string;
  tempId?: string;
  invoiceNumber?: string;
  store?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  device?: {
    deviceName?: string;
  };
  saleItems?: any[];
  items?: any[];
  subtotal?: number;
  discountAmount?: number;
  totalTax?: number;
  totalAmount?: number;
  totals?: {
    subtotal: number;
    tax: number;
    total: number;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
  syncStatus?: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
};

interface LocationState {
  sale?: SaleData;
  status?: ReceiptStatus;
  autoPrint?: boolean;
}

const ReceiptPage: React.FC = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();
  const { user } = useAuthStore();

  const [sale, setSale] = React.useState<SaleData | null>((location.state as LocationState)?.sale || null);
  const [status, setStatus] = React.useState<ReceiptStatus>(
    (location.state as LocationState)?.status || 'COMPLETED'
  );
  const [shouldAutoPrint, setShouldAutoPrint] = React.useState(
    (location.state as LocationState)?.autoPrint === true
  );
  const [autoPrintTriggered, setAutoPrintTriggered] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [emailMessage, setEmailMessage] = React.useState<string | null>(null);
  const [hasPrinted, setHasPrinted] = React.useState(false);
  const [isDataReady, setIsDataReady] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // Smart sale loading - Online-first with offline fallback
  React.useEffect(() => {
    const loadSale = async () => {
      if (!saleId) return;

      // SPECIAL CASE: Offline sales (OFF-*) with location.state - use immediately
      const isOfflineSale = saleId.startsWith('OFF-');

      // If offline sale and we have it in location.state, use immediately (no loading)
      if (isOfflineSale && location.state?.sale) {
        console.log('📦 [ReceiptPage] Offline sale from location.state (instant)');
        setSale(location.state.sale);
        setStatus(location.state.status || 'PENDING_SYNC');
        setIsLoading(false);
        console.log('✅ [ReceiptPage] Sale data set, ready for print');
        return;
      }

      // ONLINE-FIRST: If online and NOT an offline sale, fetch from API
      if (isOnline && !isOfflineSale) {
        setIsLoading(true);
        try {
          console.log('📡 [ReceiptPage] Fetching from API (online-first):', saleId);
          const res = await getSaleById(saleId);
          
          if (res.data?.success && res.data.data) {
            console.log('✅ [ReceiptPage] Loaded from API:', res.data.data);
            setSale(res.data.data);
            setStatus('COMPLETED');
            setIsLoading(false);
            return;
          } else {
            console.warn('⚠️ [ReceiptPage] API returned no data:', res.data);
          }
        } catch (error: any) {
          console.error('❌ [ReceiptPage] API fetch failed:', error.message);
          // Continue to fallback logic
        } finally {
          setIsLoading(false);
        }
      }

      // OFFLINE FALLBACK: Try local storage sources
      console.log('🔍 [ReceiptPage] Trying fallback sources...');
      
      // Priority 1: location.state
      if (location.state?.sale) {
        console.log('📦 [ReceiptPage] Using location.state fallback');
        setSale(location.state.sale);
        setStatus(location.state.status || 'COMPLETED');
        setIsLoading(false);
        return;
      }

      // Priority 2: sessionStorage
      const sessionKey = `offline-sale-${saleId}`;
      const sessionData = sessionStorage.getItem(sessionKey);
      if (sessionData) {
        try {
          const sessionSale = JSON.parse(sessionData);
          console.log('📦 [ReceiptPage] Loaded from sessionStorage');
          setSale(sessionSale);
          setStatus(sessionSale.syncStatus === 'PENDING' ? 'PENDING_SYNC' : 'COMPLETED');
          setIsLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse sessionStorage data');
        }
      }

      // Priority 3: IndexedDB
      try {
        console.log('📦 [ReceiptPage] Checking IndexedDB:', saleId);
        const offlineSale = await offlineStorage.getSale(saleId);
        
        if (offlineSale) {
          console.log('✅ [ReceiptPage] Loaded from IndexedDB');
          setSale(offlineSale);
          setStatus(offlineSale.syncStatus === 'PENDING' ? 'PENDING_SYNC' : 'COMPLETED');
          setIsLoading(false);
          return;
        }
      } catch (error: any) {
        console.error('❌ [ReceiptPage] IndexedDB error:', error);
      }

      // If we reach here, sale not found
      console.error('❌ [ReceiptPage] Sale not found in any source');
      if (!isOnline) {
        setLoadError('Sale not found in local storage. Please reconnect to sync.');
      } else if (!isOfflineSale) {
        setLoadError('Sale not found');
      }
      
      setIsLoading(false);
    };

    loadSale();
  }, [saleId, isOnline]);

  // Background sync for offline sales - runs after receipt loads
  React.useEffect(() => {
    // Only sync if: online, has sale, is offline sale (OFF-*), status is PENDING_SYNC
    const shouldSyncInBackground = 
      isOnline && 
      sale && 
      saleId?.startsWith('OFF-') && 
      status === 'PENDING_SYNC';

    if (!shouldSyncInBackground) return;

    const syncInBackground = async () => {
      console.log('🔄 [ReceiptPage] Background sync starting for:', saleId);
      try {
        const success = await offlineSync.syncSingleSale(saleId);
        if (success) {
          console.log('✅ [ReceiptPage] Background sync completed');
          setStatus('COMPLETED');
        }
      } catch (error) {
        console.warn('⚠️ [ReceiptPage] Background sync failed:', error);
        // Don't show error to user, sync will retry later
      }
    };

    // Start sync after a short delay to not block UI rendering/printing
    const syncTimer = setTimeout(syncInBackground, 1000);
    return () => clearTimeout(syncTimer);
  }, [isOnline, sale, saleId, status]);

  // Auto-print receipt when data is loaded AND autoPrint flag is true
  React.useEffect(() => {
    // Only auto-print if:
    // 1. shouldAutoPrint is true (came from COMPLETE SALE)
    // 2. Data is ready
    // 3. Not already printed
    // 4. Not already triggered
    if (!shouldAutoPrint || !sale || isDataReady || hasPrinted || autoPrintTriggered) return;

    // Check what data we have
    const hasItems = !!(sale.saleItems && Array.isArray(sale.saleItems) && sale.saleItems.length > 0);
    const hasSubtotal = sale.subtotal !== undefined && sale.subtotal !== null;
    const hasTotal = sale.totalAmount !== undefined && sale.totalAmount !== null;
    const hasInvoiceNumber = !!(sale.invoiceNumber || sale.id || sale.tempId);

    const allDataReady = hasItems && hasSubtotal && hasTotal && hasInvoiceNumber;

    if (allDataReady) {
      console.log('✅ [ReceiptPage] Receipt data ready + autoPrint flag = true, triggering print...');
      setIsDataReady(true);
      
      // Minimal delay (300ms) to ensure DOM is rendered
      const printTimer = setTimeout(() => {
        console.log('🖨️ [ReceiptPage] Auto-printing receipt...');
        window.print();
        setHasPrinted(true);
        setAutoPrintTriggered(true);
      }, 300);
      
      return () => clearTimeout(printTimer);
    }
  }, [shouldAutoPrint, sale, isDataReady, hasPrinted, autoPrintTriggered]);

  // Auto-navigate back to POS terminal after printing
  React.useEffect(() => {
    if (!hasPrinted) return;
    
    console.log('🔙 [ReceiptPage] Print completed, navigating back to POS...');
    const navigateTimer = setTimeout(() => {
      navigate('/cashier/terminal', { replace: true });
    }, 1000);
    
    return () => clearTimeout(navigateTimer);
  }, [hasPrinted, navigate]);

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

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Sale Receipt
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Loading receipt data...
            </p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-600 font-medium">Preparing your receipt...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state only if no sale data at all
  if (loadError && !sale) {
    return (
      <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Sale Receipt
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Unable to load receipt
            </p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Clock size={32} className="text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Receipt Not Available</p>
              <p className="text-sm text-slate-600 max-w-md">
                {loadError}
              </p>
            </div>
            <button
              onClick={() => navigate('/cashier/terminal')}
              className="mt-4 inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to POS</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NOTE: Removed the "!isDataReady && sale" loading state
  // Show receipt immediately when we have sale data (even if not "ready")
  // This allows users to see and print the receipt immediately

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden print:rounded-none print:border-0">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 print:hidden">
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
          {status === 'PENDING_SYNC' && isOnline && (
            <button
              type="button"
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const success = await offlineSync.syncSingleSale(saleId!);
                  if (success) {
                    setStatus('COMPLETED');
                    setOfflineSale(null);
                  }
                } catch (error) {
                  console.error('Manual sync failed:', error);
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-blue-700 disabled:bg-blue-400 transition-all"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  <span>Sync Now</span>
                </>
              )}
            </button>
          )}
          {!isOnline && status === 'PENDING_SYNC' && (
            <div className="inline-flex items-center space-x-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 border border-amber-200">
              <WifiOff size={12} />
              <span>Offline</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-0">
        <section className="md:col-span-2 border-r border-slate-200 p-6 print:p-4 print:col-span-3 print:border-0 receipt-content">
          {/* Store Info Header - For Print */}
          <div className="mb-6 pb-4 border-b-2 border-slate-300 print:block">
            {sale?.store ? (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 size={20} className="text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">{sale.store.name}</h2>
                </div>
                {sale.store.address && (
                  <div className="flex items-start space-x-2 mb-1">
                    <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{sale.store.address}</p>
                  </div>
                )}
                {sale.store.phone && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone size={16} className="text-slate-500 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Phone: {sale.store.phone}</p>
                  </div>
                )}
                {sale.store.email && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail size={16} className="text-slate-500 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Email: {sale.store.email}</p>
                  </div>
                )}
              </div>
            ) : user?.store ? (
              // Fallback to user's store info (for offline sales)
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 size={20} className="text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">{user.store.name}</h2>
                </div>
                {user.store.address && (
                  <div className="flex items-start space-x-2 mb-1">
                    <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-700">{user.store.address}</p>
                  </div>
                )}
                {user.store.phone && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone size={16} className="text-slate-500 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Phone: {user.store.phone}</p>
                  </div>
                )}
                {user.store.email && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Mail size={16} className="text-slate-500 flex-shrink-0" />
                    <p className="text-sm text-slate-700">Email: {user.store.email}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <h2 className="text-xl font-bold text-slate-900">SALE RECEIPT</h2>
              </div>
            )}
          </div>

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
                    // Handle both flat structure (offline) and nested structure (online)
                    const productName = 
                      item.productName ||                    // Offline sales (flat)
                      item.product?.name ||                  // Online sales (nested)
                      item.name ||                           // Fallback
                      'Unknown Product';
                    
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

        <aside className="p-6 flex flex-col space-y-4 print:hidden">
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

