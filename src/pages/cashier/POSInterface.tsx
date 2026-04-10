import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Scan,
  CreditCard,
  Trash2,
  Minus,
  Plus,
  X,
  Percent,
  Banknote,
  Clock,
  UserCircle2,
  Wifi,
  WifiOff,
  AlertCircle,
  Search,
  CheckCircle,
  IndianRupee,
} from 'lucide-react';
import { fetchProducts, getProductByBarcode } from '../../api/products.api';
import { createSale } from '../../api/sales.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useDeviceStore } from '../../store/useDeviceStore';
import { formatCurrency } from '../../utils/expense-utils';
import { offlineStorage } from '../../services/offline-storage.service';
import type { OfflineSale } from '../../services/offline-storage.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import ProductsFilters from '../../components/cashier/ProductsFilters';
import ProductsTable from '../../components/cashier/ProductsTable';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  discountPercentage?: number;
};

type HoldOrder = {
  id: string;
  items: CartItem[];
  timestamp: Date;
  total: number;
};

type Product = {
  id: string;
  name: string;
  sellingPrice?: number;
  price?: number;
  sku?: string;
  barcode?: string;
  stock?: number;
  taxPercentage?: number;
  discountPercentage?: number;
};

type DiscountMode = 'amount' | 'percent';

const TAX_RATE = 0.18; // 18% GST placeholder – can be wired to backend later

const POSInterface: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { deviceId } = useDeviceStore();
  const displayTerminalName = user?.assignedTerminals?.[0]?.deviceName ?? null;
  
  // Use online status hook with auto-sync
  const { isOnline, syncProgress, pendingCount, triggerSync } = useOnlineStatus();

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [holdOrders, setHoldOrders] = useState<HoldOrder[]>(() => {
    // Initialize state from localStorage on first render
    try {
      const storedOrders = localStorage.getItem('pos-hold-orders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        // Convert timestamp strings back to Date objects
        return parsedOrders.map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp)
        }));
      }
    } catch (error) {
      console.error('❌ [POSInterface] Failed to load held orders from localStorage:', error);
    }
    return [];
  });
  const [discountMode, setDiscountMode] = useState<DiscountMode>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  // Filter states for products table
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL');
  const [now, setNow] = useState<Date>(new Date());
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  // Fetch all products for grid display
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        console.log('� [POS] Loading products...');
        const res = await fetchProducts();
        
        // Extract products from response
        let products: Product[] = [];
        
        if (res?.success && Array.isArray(res.data)) {
          products = res.data;
        } else if (res?.data?.data && Array.isArray(res.data.data)) {
          products = res.data.data;
        } else if (res?.data && Array.isArray(res.data)) {
          products = res.data;
        } else if (Array.isArray(res)) {
          products = res;
        }

        console.log('📦 [POS] Parsed', products.length, 'products');
        
        // Filter active products
        const activeProducts = products.filter((p: any) => p.isActive !== false);
        console.log('✅ [POS] Loaded', activeProducts.length, 'products:', activeProducts);
        
        setAllProducts(activeProducts);
      } catch (err: any) {
        console.error('❌ [POS] Failed to load products:', err.message);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load products';
        setProductsError(errorMsg);
        setAllProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Totals
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const automaticDiscount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.price * (item.discountPercentage || 0) / 100) * item.quantity, 0),
    [cart]
  );
  
  const discountAmount = useMemo(() => {
    let manual = 0;
    if (discountValue) {
      if (discountMode === 'amount') manual = Math.min(discountValue, subtotal);
      else manual = Math.min((subtotal * discountValue) / 100, subtotal);
    }
    return Math.min(manual + automaticDiscount, subtotal);
  }, [discountMode, discountValue, subtotal, automaticDiscount]);

  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const tax = taxableBase * TAX_RATE;
  const total = taxableBase + tax;

  // Change calculation logic (frontend only)
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const changeAmount = receivedAmountNum - total;
  const hasInsufficientAmount = receivedAmount && receivedAmountNum < total;
  const hasExactAmount = receivedAmount && receivedAmountNum === total;
  const hasChange = receivedAmount && receivedAmountNum > total;

  const canCompleteSale = cart.length > 0 && !!paymentMethod && !!deviceId;

  const handleAddProductToCart = (product: Product) => {
    const unitPrice = Number(
      (product as any).sellingPrice ?? (product as any).price ?? 0
    );
    
    console.log('🛒 Adding to cart:', {
      id: product.id,
      name: product.name,
      price: unitPrice,
      type: typeof unitPrice
    });
    
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: unitPrice,
          quantity: 1,
          discountPercentage: product.discountPercentage || 0,
        },
      ];
    });
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = barcodeInput.trim();
    if (!value) return;

    setError(null);

    // Check if input looks like a barcode (numbers and dashes only, 6+ chars)
    const looksLikeBarcode = /^[0-9\-]{6,}$/.test(value);

    if (!looksLikeBarcode) {
      // If it doesn't look like a barcode, use it as a search query
      setProductSearch(value);
      setBarcodeInput('');
      return;
    }

    // If it looks like a barcode, try to fetch by barcode
    try {
      const res = await getProductByBarcode(value, deviceId);
      if (res.data?.success && res.data.data) {
        const product = res.data.data as Product;
        handleAddProductToCart(product);
        setBarcodeInput('');
      } else {
        setError(res.data?.message || 'Product not found');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Product not found');
      } else {
        setError(err.response?.data?.message || 'Unable to fetch product');
      }
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
      return updated;
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (!cart.length && !paymentMethod && !discountValue && !notes) {
      console.log('[POSInterface] Cart is already empty, nothing to clear');
      return;
    }
    if (!window.confirm('Clear all items from cart?')) return;
    console.log('[POSInterface] Clearing cart...');
    setCart([]);
    setDiscountValue(0);
    setPaymentMethod(null);
    setNotes('');
    setError(null);
  };

  const handleHoldOrder = () => {
    if (!cart.length) {
      setError('Cart is empty. Cannot hold an empty order.');
      return;
    }
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newHoldOrder: HoldOrder = {
      id: `ORDER-${Date.now()}`,
      items: [...cart],
      timestamp: new Date(),
      total: cartTotal,
    };
    
    // Add to state - useEffect will save to localStorage
    setHoldOrders((prev) => [newHoldOrder, ...prev]);
    console.log(`✅ [POSInterface] Held order created: ${newHoldOrder.id}`);
    
    // Clear cart
    setCart([]);
    setDiscountValue(0);
    setPaymentMethod(null);
    setNotes('');
    setError(null);
  };

  const handleResumeOrder = (holdOrderId: string) => {
    const holdOrder = holdOrders.find((order) => order.id === holdOrderId);
    if (!holdOrder) return;
    
    // Restore cart from held order
    setCart(holdOrder.items);
    
    // Remove from state - useEffect will update localStorage
    setHoldOrders((prev) => prev.filter((order) => order.id !== holdOrderId));
    console.log(`✅ [POSInterface] Held order resumed: ${holdOrderId}`);
  };

  const handleDeleteHoldOrder = (holdOrderId: string) => {
    if (!window.confirm('Delete this hold order?')) return;
    
    // Remove from state - useEffect will update localStorage
    setHoldOrders((prev) => prev.filter((order) => order.id !== holdOrderId));
    console.log(`✅ [POSInterface] Held order deleted: ${holdOrderId}`);
  };

  // Sync hold orders to localStorage whenever they change
  useEffect(() => {
    try {
      // Always sync to ensure localStorage is up to date
      localStorage.setItem('pos-hold-orders', JSON.stringify(holdOrders));
      if (holdOrders.length > 0) {
        console.log(`💾 [POSInterface] Synced ${holdOrders.length} held orders to localStorage`);
      }
    } catch (error) {
      console.error('❌ [POSInterface] Failed to save held orders to localStorage:', error);
    }
  }, [holdOrders]);

  const handleCompleteSale = async () => {
    console.log('🔴 [POSInterface] handleCompleteSale called');
    console.log('🔵 [POSInterface] canCompleteSale:', canCompleteSale);
    console.log('🔵 [POSInterface] deviceId:', deviceId);
    console.log('🔵 [POSInterface] cart.length:', cart.length);
    console.log('🔵 [POSInterface] paymentMethod:', paymentMethod);

    // Check individual requirements
    const missingRequirements = [];
    if (!cart || cart.length === 0) missingRequirements.push('cart is empty');
    if (!paymentMethod) missingRequirements.push('no payment method selected');
    if (!deviceId) missingRequirements.push('no device connected');

    if (!canCompleteSale || !deviceId) {
      console.error('❌ [POSInterface] Sale blocked - missing requirements:', missingRequirements.join(', '));
      setError('Cannot complete sale: ' + missingRequirements.join(', ') + '. Please add items, select payment method, and connect to terminal.');
      return;
    }

    // Validate items array is not empty
    if (!cart || cart.length === 0) {
      console.error('❌ [POSInterface] Sale blocked - cart is empty');
      setError('Cart is empty. Please add items before completing the sale.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Ensure all numeric values are properly converted to numbers (not strings)
    const numericDiscountAmount = typeof discountAmount === 'number' ? discountAmount : Number(discountAmount) || 0;

    // Build items array matching backend expectations
    // Backend validates: item.productId, item.quantity > 0, item.price >= 0
    // We also send productName, unitPrice, totalPrice for completeness
    const itemsPayload = cart.map((item) => {
      // Ensure price is a number, not a string (CRITICAL for backend validation)
      const numericPrice = typeof item.price === 'number' ? item.price : Number(item.price) || 0;
      // Ensure quantity is a number, not a string
      const numericQuantity = typeof item.quantity === 'number' ? item.quantity : Number(item.quantity) || 1;
      // Calculate total price for this line item
      const totalPrice = numericPrice * numericQuantity;
      
      console.log('🛒 [POSInterface] Processing item:', {
        id: item.id,
        name: item.name,
        rawPrice: item.price,
        numericPrice,
        numericQuantity,
        totalPrice,
      });
      
      return {
        productId: item.id,
        productName: item.name,
        unitPrice: numericPrice,
        quantity: numericQuantity,
        totalPrice: totalPrice,
        price: numericPrice, // REQUIRED: Backend validates this field name
      };
    });

    const payload = {
      deviceId: deviceId,
      paymentMethod: paymentMethod,
      discountAmount: numericDiscountAmount,
      notes: notes || undefined,
      items: itemsPayload,
    };

    // Validate payload before sending
    const validationErrors = [];
    if (!payload.deviceId) validationErrors.push('deviceId is missing');
    if (!payload.paymentMethod) validationErrors.push('paymentMethod is missing');
    if (!payload.items || payload.items.length === 0) validationErrors.push('items array is empty');
    
    payload.items.forEach((item: any, idx: number) => {
      if (!item.productId) validationErrors.push(`items[${idx}].productId is missing`);
      if (item.price === undefined || item.price === null || item.price < 0) validationErrors.push(`items[${idx}].price must be >= 0`);
      if (!item.quantity || item.quantity <= 0) validationErrors.push(`items[${idx}].quantity must be > 0`);
    });

    if (validationErrors.length > 0) {
      console.error('❌ [POSInterface] Payload validation failed:', validationErrors);
      setError('Invalid sale data: ' + validationErrors.join(', '));
      setIsSubmitting(false);
      return;
    }

    // Log complete payload for debugging
    console.log('🟢 [POSInterface] === SALE PAYLOAD ===');
    console.log('🟢 deviceId:', payload.deviceId, `(type: ${typeof payload.deviceId})`);
    console.log('🟢 paymentMethod:', payload.paymentMethod, `(type: ${typeof payload.paymentMethod})`);
    console.log('🟢 discountAmount:', payload.discountAmount, `(type: ${typeof payload.discountAmount})`);
    console.log('🟢 notes:', payload.notes);
    console.log('🟢 items count:', payload.items.length);
    console.log('🟢 items:', JSON.stringify(payload.items, null, 2));
    console.log('🟢 isOnline:', isOnline);
    console.log('🟢 ==========================');

    try {
      if (isOnline) {
        console.log('📡 [POSInterface] Sending POST /sales request (online mode)...');
        const res = await createSale(payload, idempotencyKey);
        console.log('✅ [POSInterface] Sale created response:', JSON.stringify(res, null, 2));

        // createSale returns res.data which is { success, data: {sale}, message }
        // The actual sale object is in res.data.data.sale or res.data
        const saleData = res?.data?.sale || res?.data || res;

        if (saleData && saleData.id) {
          console.log('✅ [POSInterface] Sale created successfully:', saleData);
          console.log('📦 [POSInterface] Sale items:', saleData.saleItems || saleData.items);
          
          // Clear cart
          setCart([]);
          setDiscountValue(0);
          setPaymentMethod(null);
          setNotes('');
          
          // Navigate to receipt page with autoPrint flag
          console.log('🧭 [POSInterface] Navigating to receipt page with autoPrint: true');
          navigate(`/cashier/receipt/${saleData.id}`, {
            state: { sale: saleData, status: 'COMPLETED', autoPrint: true },
          });
        } else {
          console.error('❌ [POSInterface] Sale response missing data:', res);
          setError(res?.message || 'Unable to complete sale');
        }
      } else {
        // OFFLINE MODE - Save to IndexedDB and redirect to receipt page
        console.log('🔴 [POSInterface] OFFLINE MODE - Saving sale locally...');

        const tempId = `OFF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const invoiceNumber = `OFF-${Date.now()}`;

        const offlineSale: OfflineSale = {
          tempId,
          invoiceNumber,
          deviceId,
          paymentMethod,
          discountAmount: numericDiscountAmount,
          notes: notes || undefined,
          items: payload.items,
          totals: { subtotal, tax, total },
          createdAt: new Date().toISOString(),
          syncStatus: 'PENDING',
          retryCount: 0,
        };

        // Save to IndexedDB
        await offlineStorage.saveSale(offlineSale);
        console.log('✅ [OfflineStorage] Sale saved locally:', tempId);

        // Clear cart
        setCart([]);
        setDiscountValue(0);
        setPaymentMethod(null);
        setNotes('');

        // Store sale in sessionStorage for instant access
        sessionStorage.setItem(`offline-sale-${tempId}`, JSON.stringify(offlineSale));

        // Navigate to receipt page with offline sale data for auto-print
        navigate(`/cashier/receipt/offline/${tempId}`, {
          state: {
            sale: {
              id: tempId,
              tempId,
              invoiceNumber,
              deviceId,
              paymentMethod,
              discountAmount: numericDiscountAmount,
              notes: notes || undefined,
              saleItems: payload.items.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                unitPrice: item.unitPrice,
                subtotal: item.totalPrice,
              })),
              subtotal,
              totalTax: tax,
              totalAmount: total,
              createdAt: new Date().toISOString(),
              syncStatus: 'PENDING',
            },
            status: 'PENDING_SYNC',
            autoPrint: true,
          },
        });
      }
    } catch (err: any) {
      console.error('❌ [POSInterface] Sale error:', err);
      console.error('❌ [POSInterface] Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      
      // Log the full backend response for debugging
      console.log('🔍 [POSInterface] Backend response:', JSON.stringify(err.response?.data, null, 2));
      
      // Extract error message from backend response
      let msg = 'Failed to complete sale';
      if (err.response?.data) {
        const backendData = err.response.data;
        console.log('📝 [POSInterface] Backend data type:', typeof backendData);
        console.log('📝 [POSInterface] Backend data keys:', Object.keys(backendData));
        
        // Try multiple possible error message fields
        msg = backendData.message 
           || backendData.error 
           || backendData.msg
           || backendData.errorMessage
           || (typeof backendData === 'string' ? backendData : null)
           || msg;
      }
      
      console.log('💬 [POSInterface] Displaying error message:', msg);
      
      // Display the error to user
      setError(msg);
      setIsSubmitting(false);
    }
  };

  // Filter products based on search, category, and stock
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Apply search filter
    if (productSearch) {
      const query = productSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (productCategory !== 'ALL') {
      const category = typeof allProducts[0]?.category === 'object'
        ? allProducts[0]?.category?.name
        : allProducts[0]?.category;
      
      result = result.filter((p) => {
        const prodCategory = typeof p.category === 'object' ? p.category?.name : p.category;
        return prodCategory === productCategory;
      });
    }

    // Apply stock filter
    if (productStockFilter !== 'ALL') {
      result = result.filter((p) => {
        const stock = p.inventoryStock?.totalQuantity ?? p.stock ?? 0;
        if (productStockFilter === 'IN_STOCK') return stock > 0;
        if (productStockFilter === 'LOW_STOCK') return stock > 0 && stock <= 5;
        if (productStockFilter === 'OUT_OF_STOCK') return stock <= 0;
        return true;
      });
    }

    return result;
  }, [allProducts, productSearch, productCategory, productStockFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach((p) => {
      const cat = typeof p.category === 'object' ? p.category?.name || 'N/A' : p.category || 'N/A';
      cats.add(cat);
    });
    return ['ALL', ...Array.from(cats)];
  }, [allProducts]);

  const handleResetFilters = () => {
    setProductSearch('');
    setProductCategory('ALL');
    setProductStockFilter('ALL');
  };

  return (
    <>
      {/* Hold Orders Section */}
      {holdOrders.length > 0 && (
        <div className="mb-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Clock size={14} className="text-indigo-500" />
              Hold Orders <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[9px] ml-1">{holdOrders.length}</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {holdOrders.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full -mr-8 -mt-8"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.id}</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg">
                      {order.items.length} Items
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResumeOrder(order.id)}
                      className="flex-1 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteHoldOrder(order.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-500">

      {/* Offline Banner */}
      {isOnline === false && (
        <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-200 text-blue-900 text-sm font-medium">
          <div className="flex items-center space-x-3">
            <WifiOff size={16} className="text-blue-500" />
            <span className="font-semibold">
              YOU ARE OFFLINE
            </span>
            <span className="text-blue-700">
              – Sales will be saved locally and synced when back online.
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <Clock size={14} className="text-blue-600" />
              <span className="font-bold">{pendingCount} pending sync</span>
            </div>
          )}
        </div>
      )}

      {/* Sync Progress Banner */}
      {syncProgress && syncProgress.status === 'syncing' && (
        <div className="flex items-center justify-between px-6 py-3 bg-blue-50 border-b border-blue-200 text-blue-900 text-sm font-medium">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-semibold">
              SYNCING OFFLINE SALES
            </span>
            <span className="text-blue-700">
              {syncProgress.completed}/{syncProgress.total} completed
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-32 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(syncProgress.completed / syncProgress.total) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold">{Math.round((syncProgress.completed / syncProgress.total) * 100)}%</span>
          </div>
        </div>
      )}

      {/* Sync Complete Banner */}
      {syncProgress && syncProgress.status === 'completed' && (
        <div className="flex items-center justify-between px-6 py-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-sm font-medium">
          <div className="flex items-center space-x-3">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="font-semibold">
              SYNC COMPLETED
            </span>
            <span className="text-emerald-700">
              {syncProgress.message}
            </span>
          </div>
        </div>
      )}

      {/* Sync Error Banner */}
      {syncProgress && syncProgress.status === 'error' && (
        <div className="flex items-center justify-between px-6 py-3 bg-red-50 border-b border-red-200 text-red-900 text-sm font-medium">
          <div className="flex items-center space-x-3">
            <AlertCircle size={16} className="text-red-500" />
            <span className="font-semibold">
              SYNC FAILED
            </span>
            <span className="text-red-700">
              {syncProgress.message}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-3 px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm font-medium">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col overflow-hidden flex-1">
        <div className="flex overflow-hidden flex-1">
          {/* Left: Barcode Scan, Products & Cart */}
          <section className="flex-1 flex flex-col gap-4 p-6 overflow-hidden border-r border-slate-200">
            {/* Barcode Scanner */}
            <form onSubmit={handleScanSubmit} className="flex-shrink-0">
              <div className="relative">
                <Scan className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or type product name/SKU..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>
            </form>

            {/* Products Table with Filters - takes remaining space */}
            <div className="flex-1 overflow-auto space-y-4 min-h-0">
              {/* Filters */}
              <ProductsFilters
                searchQuery={productSearch}
                setSearchQuery={setProductSearch}
                selectedCategory={productCategory}
                setSelectedCategory={setProductCategory}
                stockFilter={productStockFilter}
                setStockFilter={setProductStockFilter}
                categories={categories}
                onReset={handleResetFilters}
              />

              {/* Table */}
              <ProductsTable
                products={filteredProducts}
                loading={productsLoading}
                onAddToCart={handleAddProductToCart}
              />
            </div>

            {/* Cart Cards Section - shows added products as cards */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 flex items-center space-x-2">
                    <ShoppingCart size={14} className="text-emerald-600" />
                    <span>Added Products ({cart.length} items)</span>
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-xl border border-blue-200 bg-blue-50 p-3 hover:shadow-md transition-shadow"
                    >
                      {/* Product Image Placeholder */}
                      <div className="w-full h-20 bg-blue-100 rounded-lg mb-2 flex items-center justify-center border border-blue-200">
                        <ShoppingCart size={24} className="text-blue-400" />
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 mb-2 flex-1">
                        {item.name}
                      </h4>

                      {/* Price */}
                      <div className="mb-2">
                        <span className="text-[10px] text-slate-600">Price:</span>
                        <div className="text-xs font-bold text-slate-900">
                          {formatCurrency(item.price)}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mb-2 bg-white rounded-lg border border-blue-200 p-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="p-0.5 text-slate-500 hover:text-blue-600"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-900 w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="p-0.5 text-slate-500 hover:text-blue-600"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="mb-2 text-center">
                        <span className="text-[9px] text-slate-600">Subtotal:</span>
                        <div className="text-xs font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-full rounded-xl bg-red-50 border border-red-200 text-red-600 px-2 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                      >
                        <X size={10} className="inline mr-1" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Table Section (Optional - can be kept for detailed view) */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden max-h-48 overflow-y-auto hidden">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 sticky top-0">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 flex items-center space-x-2">
                    <ShoppingCart size={14} className="text-emerald-600" />
                    <span>Current Cart ({cart.length} items)</span>
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-2 py-2 text-center w-32">Qty</th>
                      <th className="px-4 py-2 text-right w-24">@Price</th>
                      <th className="px-4 py-2 text-right w-28">Line Total</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2">
                          <div className="text-[12px] font-semibold text-slate-900">
                            {item.name}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              className="p-1 text-slate-500 hover:text-emerald-500"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              className="p-1 text-slate-500 hover:text-emerald-500"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-[12px] font-semibold text-slate-700">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-2 text-right text-[12px] font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Right: Totals & Payment */}
          <aside className="w-80 flex flex-col bg-white/50">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
              <ShoppingCart size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold">Active Cart</h2>
            </div>

            <div className="px-4 py-3 border-b border-slate-200 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax (GST)</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold text-slate-900">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
              <hr className="my-1.5 border-dashed border-slate-200" />
              <div className="flex justify-between items-center text-base font-black">
                <span className="flex items-center space-x-1 text-slate-900">
                  <Banknote size={16} />
                  <span>Total</span>
                </span>
                <span className="text-slate-900 text-lg font-bold">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Discount controls */}
            <div className="p-4 border-b border-slate-200 space-y-3 text-xs">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDiscountMode('amount')}
                  className={`flex-1 inline-flex items-center justify-center space-x-1 rounded-xl border px-2 py-1 font-bold uppercase tracking-widest ${
                    discountMode === 'amount'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  <span className="text-xs">Rs.</span>
                  <span>Amount</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('percent')}
                  className={`flex-1 inline-flex items-center justify-center space-x-1 rounded-xl border px-2 py-1 font-bold uppercase tracking-widest ${
                    discountMode === 'percent'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  <Percent size={13} />
                  <span>Percent</span>
                </button>
              </div>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  min={0}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-400"
                  placeholder={discountMode === 'amount' ? 'Rs. amount' : '% value'}
                />
                <span className="text-[11px] text-slate-500 font-semibold">
                  APPLY DISCOUNT
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="text-[11px] text-slate-900 font-medium">
                  Applied discount:{' '}
                  {discountMode === 'amount'
                    ? formatCurrency(discountAmount)
                    : `${discountValue}% (${formatCurrency(discountAmount)})`}
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">
                Payment Method
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'CASH', value: 'CASH' },
                  { label: 'CARD/BANK', value: 'CARD' },
                ].map(
                  ({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentMethod(value)}
                      className={`rounded-xl px-2 py-1.5 text-[11px] font-bold uppercase tracking-widest border ${
                        paymentMethod === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {label.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>Customer Notes</span>
                  <span className="text-slate-400">(optional)</span>
                </div>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Customer notes..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-900 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Received Amount & Change Calculation */}
            {paymentMethod === 'CASH' && cart.length > 0 && (
              <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  <span>Payment Details</span>
                </div>

                {/* Received Amount Input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="Enter amount received"
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                </div>

                {/* Change Display */}
                {receivedAmount && (
                  <div className={`rounded-xl p-3 border-2 ${
                    hasInsufficientAmount
                      ? 'bg-red-50 border-red-200'
                      : hasExactAmount
                      ? 'bg-blue-50 border-blue-200'
                      : hasChange
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Bill Total
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Received
                      </span>
                      <span className="text-sm font-bold text-slate-700">
                        {formatCurrency(receivedAmountNum)}
                      </span>
                    </div>
                    <hr className={`my-2 border-dashed ${
                      hasInsufficientAmount
                        ? 'border-red-200'
                        : hasExactAmount
                        ? 'border-blue-200'
                        : hasChange
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {hasInsufficientAmount ? 'Shortage' : hasExactAmount ? 'Status' : 'Change'}
                      </span>
                      <span className={`text-lg font-black ${
                        hasInsufficientAmount
                          ? 'text-red-600'
                          : hasExactAmount
                          ? 'text-slate-900'
                          : hasChange
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}>
                        {hasInsufficientAmount
                          ? formatCurrency(Math.abs(changeAmount))
                          : hasExactAmount
                          ? 'No Change'
                          : hasChange
                          ? formatCurrency(changeAmount)
                          : formatCurrency(0)
                        }
                      </span>
                    </div>
                    {hasInsufficientAmount && (
                      <div className="mt-2 flex items-center space-x-1 text-[10px] text-red-600 font-bold">
                        <AlertCircle size={12} />
                        <span>Insufficient amount received</span>
                      </div>
                    )}
                    {hasExactAmount && (
                      <div className="mt-2 flex items-center space-x-1 text-[10px] text-slate-900 font-bold">
                        <CheckCircle size={12} />
                        <span>Exact amount paid</span>
                      </div>
                    )}
                    {hasChange && (
                      <div className="mt-2 flex items-center space-x-1 text-[10px] text-slate-900 font-bold">
                        <CheckCircle size={12} />
                        <span>Return to customer</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons - Compact layout */}
            <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2">
              {/* Hold Order Button */}
              <button
                type="button"
                onClick={handleHoldOrder}
                disabled={!cart.length}
                className="w-full rounded-xl border-2 border-blue-500 bg-blue-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 flex items-center justify-center space-x-1.5 transition-all"
              >
                <Clock size={14} />
                <span>Hold Current Order</span>
              </button>

              {/* Clear Cart & Complete Sale */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-100 flex items-center justify-center space-x-1"
                >
                  <Trash2 size={12} />
                  <span>CLEAR</span>
                </button>
                <button
                  type="button"
                  disabled={!canCompleteSale || isSubmitting}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleCompleteSale();
                  }}
                  title={!canCompleteSale ?
                    `${!cart.length ? 'Add items to cart. ' : ''}${!paymentMethod ? 'Select payment method. ' : ''}${!deviceId ? 'Connect to terminal. ' : ''}`.trim()
                    : ''}
                  className={`rounded-xl px-2 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-1.5 transition-all ${
                    !canCompleteSale || isSubmitting
                      ? 'bg-blue-300 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white shadow-md shadow-blue-600/30 hover:bg-blue-700 cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <CreditCard size={12} className="animate-pulse" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={12} />
                      <span>COMPLETE</span>
                    </>
                  )}
                </button>
              </div>

              {/* Online/Offline Status */}
              <div className="flex items-center justify-between text-[9px] font-medium text-slate-500 pt-1">
                <div className="flex items-center space-x-1">
                  {isOnline ? (
                    <Wifi size={11} className="text-blue-600" />
                  ) : (
                    <WifiOff size={11} className="text-slate-400" />
                  )}
                  <span>
                    {isOnline ? 'Online mode' : 'Offline mode'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
    </>
  );
};

export default POSInterface;
