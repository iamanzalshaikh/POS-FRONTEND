import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Scan,
  CreditCard,
  Trash2,
  Minus,
  Plus,
  X,
  NotebookTabs,
  Percent,
  Banknote,
  Clock,
  UserCircle2,
  Wifi,
  WifiOff,
  AlertCircle,
  Search,
  CheckCircle,
  
} from 'lucide-react';
import { fetchProducts, getProductByBarcode } from '../../api/products.api';
import { createSale, getSalesTransactions } from '../../api/sales.api';
import { devicesApi } from '../../service/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useDeviceStore } from '../../store/useDeviceStore';
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatCurrency, formatAmount } from '../../utils/expense-utils';
import { offlineStorage } from '../../services/offline-storage.service';
import type { OfflineSale } from '../../services/offline-storage.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSocket } from '../../hooks/useSocket';
import ProductsFilters from '../../components/cashier/ProductsFilters';
import ProductsTable from '../../components/cashier/ProductsTable';
import ThermalReceipt from '../../components/cashier/ThermalReceipt';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  /** Matches product tax; backend uses batch % then product % — cart uses product for preview. */
  taxPercentage?: number;
  discountPercentage?: number;
  activeBatches?: Array<{
    id: string;
    sellingPrice: number;
    quantityRemaining: number;
    discountPercentage: number;
    taxPercentage: number;
  }>;
  totalStock?: number;
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
  latestSellingPrice?: number;
  latestDiscountPercentage?: number;
  oldestBatchRemaining?: number;
  oldestBatchDiscount?: number;
  activeBatches?: Array<{
    id: string;
    sellingPrice: number;
    quantityRemaining: number;
    discountPercentage: number;
    taxPercentage: number;
  }>;
  category?: any;
  inventoryStock?: { totalQuantity?: number };
};

type DiscountMode = 'amount' | 'percent';

function parseProductTaxPct(product: {
  effectiveTaxPercentage?: unknown;
  taxPercentage?: unknown;
}): number {
  const raw = product.effectiveTaxPercentage ?? product.taxPercentage;
  if (raw === null || raw === undefined) return 0;
  const n =
    typeof raw === 'object' && raw !== null && 'toString' in raw
      ? Number(String(raw))
      : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const POSInterface: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { deviceId, terminalLane, totalLanes, setDevice } = useDeviceStore();
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
  const [paymentMethod, setPaymentMethod] = useState<string | null>('CASH');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Filter states for products table
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('ALL');
  const [productStockFilter, setProductStockFilter] = useState('ALL');
  const queryClient = useQueryClient();
  const [now, setNow] = useState<Date>(new Date());
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [lastSaleForReceipt, setLastSaleForReceipt] = useState<any | null>(null);

  const [lastSequence, setLastSequence] = useState<number>(() => {
    return Number(localStorage.getItem('pos-last-sequence')) || 0;
  });
  const [offlineSyncCount, setOfflineSyncCount] = useState<number>(() => {
    return Number(localStorage.getItem('pos-offline-count')) || 0;
  });

  // Extract fetchLastSeq to a memoized function so we can refresh it after online sales
  const refreshSequence = useCallback(async () => {
    if (!isOnline) return;
    try {
      // 1. Refresh Sequence from last sale
      const res = await getSalesTransactions({ limit: 1, deviceId });
      const lastSale = res?.[0] || res?.data?.[0];
      if (lastSale?.invoiceNumber) {
        const seqStr = lastSale.invoiceNumber.slice(-6);
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq)) {
          console.log('🔄 [POSInterface] Sequence refreshed:', seq);
          setLastSequence(seq);
          localStorage.setItem('pos-last-sequence', seq.toString());
          setOfflineSyncCount(0);
          localStorage.setItem('pos-offline-count', '0');
        }
      }

      // 2. SELF-HEALING: Refresh Lane and Total Lanes from server
      // This ensures if a new terminal was added, we pick up the new interleaving rules.
      const devicesRes = await devicesApi.getAll();
      const list = devicesRes.data?.data || devicesRes.data || [];
      if (Array.isArray(list)) {
        const activeOnes = list.filter((d: any) => d.isActive);
        const sorted = [...activeOnes].sort((a, b) => a.id.localeCompare(b.id));
        const idx = sorted.findIndex((d: any) => d.id === deviceId);
        const newLane = idx !== -1 ? idx + 1 : 1;
        const newTotal = Math.max(1, sorted.length);

        if (newLane !== terminalLane || newTotal !== totalLanes) {
          console.log(`🔄 [POSInterface] Lane info self-healed: Lane ${newLane} of ${newTotal}`);
          setDevice({
            deviceId: deviceId!,
            terminalLane: newLane,
            totalLanes: newTotal
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ [POSInterface] Sequence refresh failed:', err);
    }
  }, [isOnline, deviceId, terminalLane, totalLanes, setDevice]);

  useEffect(() => {
    refreshSequence();
  }, [refreshSequence]);

  // Real-time stock updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    socket.on('inventory:updated', (data: any) => {
      console.log('📡 [Socket] Inventory update received:', data);
      // Invalidate all product/inventory related queries
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-catalog'] });
    });

    return () => {
      socket.off('inventory:updated');
    };
  }, [socket, queryClient]);

  // Rest of effects ...

  // Inside handleCompleteSale, after successful online submission:
  // refreshSequence();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  const { 
    data: productsRes, 
    isLoading: productsLoading, 
    isFetching: productsFetching,
    error: pQueryError,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
        if (!isOnline) {
            console.log('📶 [POSInterface] Offline: Fetching products from local cache...');
            const cached = await offlineStorage.getProducts();
            return { success: true, data: cached };
        }
        
        try {
            const data = await fetchProducts();
            return data;
        } catch (err) {
            console.warn('⚠️ [POSInterface] API failed, trying local cache...', err);
            const cached = await offlineStorage.getProducts();
            return { success: true, data: cached };
        }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: isOnline ? 1000 * 60 * 5 : false,
  });

  const productsError = pQueryError ? (pQueryError as any).message : null;

  const allProducts = useMemo(() => {
    let products: Product[] = [];
    
    if (productsRes?.success && Array.isArray(productsRes.data)) {
      products = productsRes.data;
    } else if (productsRes?.data?.data && Array.isArray(productsRes.data.data)) {
      products = productsRes.data.data;
    } else if (productsRes?.data && Array.isArray(productsRes.data)) {
      products = productsRes.data;
    } else if (Array.isArray(productsRes)) {
      products = productsRes;
    }

    // Filter active products
    return products.filter((p: any) => p.isActive !== false);
  }, [productsRes]);

  // Persistent Cache Sync: Save products to local storage whenever they are successfully fetched online
  useEffect(() => {
    if (isOnline && allProducts.length > 0) {
        offlineStorage.saveProducts(allProducts)
            .catch(err => console.error('❌ [POSInterface] Failed to cache products:', err));
    }
  }, [allProducts, isOnline]);

  // Totals
  const calculateLineDetails = useCallback((item: CartItem) => {
    let remainingToFulfill = item.quantity;
    let lineSubtotal = 0;
    let lineDiscount = 0;
    let lineTax = 0;

    const batches = item.activeBatches || [];
    
    if (batches.length > 0) {
      for (const batch of batches) {
        if (remainingToFulfill <= 0) break;
        
        const take = Math.min(batch.quantityRemaining, remainingToFulfill);
        const price = batch.sellingPrice;
        const discPct = batch.discountPercentage || 0;
        const taxPct = batch.taxPercentage || item.taxPercentage || 0;
        
        const batchBase = price * take;
        lineSubtotal += batchBase;
        lineDiscount += (batchBase * discPct) / 100;
        lineTax += (batchBase * taxPct) / 100;
        
        remainingToFulfill -= take;
      }
    }
    
    // Fallback for overselling (CASH/CARD bypass) or if no batches exist
    if (remainingToFulfill > 0) {
      const fallbackPrice = item.price;
      const fallbackDisc = item.discountPercentage || 0;
      const fallbackTax = item.taxPercentage || 0;
      
      const fallbackBase = fallbackPrice * remainingToFulfill;
      lineSubtotal += fallbackBase;
      lineDiscount += (fallbackBase * fallbackDisc) / 100;
      lineTax += (fallbackBase * fallbackTax) / 100;
    }

    return { subtotal: lineSubtotal, discount: lineDiscount, tax: lineTax };
  }, []);

  const { subtotal, automaticDiscount, tax } = useMemo(() => {
    let s = 0;
    let d = 0;
    let t = 0;
    
    for (const item of cart) {
      const details = calculateLineDetails(item);
      s += details.subtotal;
      d += details.discount;
      t += details.tax;
    }
    
    return { subtotal: s, automaticDiscount: d, tax: t };
  }, [cart, calculateLineDetails]);

  const discountAmount = useMemo(() => {
    let manual = 0;
    if (discountValue) {
      if (discountMode === 'amount') manual = Math.min(discountValue, subtotal);
      else manual = Math.min((subtotal * discountValue) / 100, subtotal);
    }
    return Math.min(manual + automaticDiscount, subtotal);
  }, [discountMode, discountValue, subtotal, automaticDiscount]);

  // TAX INCLUSIVE: Total is just Subtotal - Discount. 
  // The tax amount (21.60) is shown as a breakdown but is NOT added to the price.
  const total = Math.max(0, subtotal - discountAmount);

  // Change calculation logic (frontend only)
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const changeAmount = receivedAmountNum - total;
  const hasInsufficientAmount = receivedAmount && receivedAmountNum < total;
  const hasExactAmount = receivedAmount && receivedAmountNum === total;
  const hasChange = receivedAmount && receivedAmountNum > total;

  const canCompleteSale = cart.length > 0 && !!paymentMethod && !!deviceId && (
    paymentMethod !== 'CASH' || (receivedAmount !== '' && Number(receivedAmount) >= total)
  );

  const handleAddProductToCart = (product: Product) => {
    const unitPrice = Number(
      (product as any).sellingPrice ?? (product as any).price ?? 0
    );
    const totalStock = product.inventoryStock?.totalQuantity ?? product.stock ?? 0;
    
    console.log('🛒 Adding to cart:', {
      id: product.id,
      name: product.name,
      price: unitPrice,
      totalStock
    });
    
    setError(null);

    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        if (existing.quantity + 1 > (existing.totalStock ?? totalStock)) {
          setError(`Cannot add more ${product.name}. Only ${totalStock} in stock.`);
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      
      if (totalStock <= 0) {
        setError(`${product.name} is out of stock.`);
        return prev;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: unitPrice,
          quantity: 1,
          taxPercentage: parseProductTaxPct(product),
          discountPercentage: product.discountPercentage || 0,
          activeBatches: (product as any).activeBatches || [],
          totalStock: totalStock,
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
      let product: Product | null = null;

      if (!isOnline) {
        console.log('📶 [POSInterface] Offline: Checking local product cache for barcode:', value);
        product = await offlineStorage.getProductByBarcode(value);
      } else {
        const res = await getProductByBarcode(value, deviceId);
        if (res.data?.success && res.data.data) {
          product = res.data.data as Product;
        } else {
            // Fallback to local if API says not found but we are online (maybe recently synced)
            product = await offlineStorage.getProductByBarcode(value);
        }
      }

      if (product) {
        handleAddProductToCart(product);
        setBarcodeInput('');
      } else {
        setError('Product not found in system or cache.');
      }
    } catch (err: any) {
      console.error('❌ [POSInterface] Barcode fetch error:', err);
      // Final attempt: check local storage anyway on error
      const cachedProduct = await offlineStorage.getProductByBarcode(value);
      if (cachedProduct) {
        handleAddProductToCart(cachedProduct);
        setBarcodeInput('');
      } else {
        setError('Product lookup failed. Please try manual search.');
      }
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find(i => i.id === itemId);
      if (item && delta > 0 && item.quantity + delta > (item.totalStock ?? Infinity)) {
        setError(`Cannot add more. Only ${item.totalStock} units available.`);
        return prev;
      }

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

  const handleDirectQuantityChange = (itemId: string, value: string) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 1) return;
    
    setCart((prev) => {
      const item = prev.find(i => i.id === itemId);
      if (item && numericValue > (item.totalStock ?? Infinity)) {
        setError(`Limit reached. Only ${item.totalStock} units available.`);
        return prev.map((i) => i.id === itemId ? { ...i, quantity: item.totalStock ?? i.quantity } : i);
      }

      return prev.map((item) => 
        item.id === itemId ? { ...item, quantity: numericValue } : item
      );
    });
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
    setPaymentMethod('CASH');
    setReceivedAmount('');
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

  // Handle direct printing when a sale is completed
  useEffect(() => {
    if (lastSaleForReceipt) {
      console.log('🖨️ [POSInterface] Triggering direct print for:', lastSaleForReceipt.id);
      
      // Delay to ensure the DOM is updated with the new sale data
      const printTimer = setTimeout(() => {
        window.print();
        // Clear the receipt data after print dialog opens so it can be re-triggered
        setLastSaleForReceipt(null);
      }, 500);

      return () => clearTimeout(printTimer);
    }
  }, [lastSaleForReceipt]);

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

    if (isSubmitting) return;

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
        taxPercentage: item.taxPercentage || 0,
      };
    });

    const payload = {
      deviceId: deviceId,
      paymentMethod: paymentMethod,
      discountAmount: numericDiscountAmount,
      notes: notes || undefined,
      receivedAmount: paymentMethod === 'CASH' ? receivedAmountNum : undefined,
      changeAmount: paymentMethod === 'CASH' ? changeAmount : undefined,
      items: itemsPayload,
      terminalLane,
      totalLanes,
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
          setPaymentMethod('CASH');
          setReceivedAmount('');
          setNotes('');
          
          // Trigger direct print by updating state
          console.log('🖨️ [POSInterface] Preparing direct print...');
          setLastSaleForReceipt(saleData);
          // 1. OPTIMISTIC UPDATE: Update products cache immediately
          try {
            // Force a sequence refresh so we are ready for the next sale (even if offline next)
            refreshSequence();
            queryClient.setQueryData(['products', { isActive: true, limit: 1000 }], (oldData: any) => {
              if (!oldData) return oldData;
              
              // Handle different API response structures
              const products = oldData.data?.data || oldData.data || oldData;
              if (!Array.isArray(products)) return oldData;
              
              const updatedProducts = products.map((p: any) => {
                const cartItem = cart.find(item => item.id === p.id);
                if (cartItem) {
                  const currentQty = p.inventoryStock?.totalQuantity || 0;
                  const newTotalQty = Math.max(0, currentQty - cartItem.quantity);
                  
                  // Optimistically update activeBatches too so the price jumps
                  let remainingToDeduct = cartItem.quantity;
                  const newBatches = (p.activeBatches || []).map((b: any) => {
                    if (remainingToDeduct <= 0) return b;
                    const take = Math.min(b.quantityRemaining, remainingToDeduct);
                    remainingToDeduct -= take;
                    return { ...b, quantityRemaining: b.quantityRemaining - take };
                  }).filter((b: any) => b.quantityRemaining > 0);

                  return {
                    ...p,
                    activeBatches: newBatches,
                    sellingPrice: newBatches[0]?.sellingPrice ?? p.sellingPrice,
                    inventoryStock: {
                      ...p.inventoryStock,
                      totalQuantity: newTotalQty
                    }
                  };
                }
                return p;
              });
              
              // Re-wrap in original structure
              if (oldData.data?.data) return { ...oldData, data: { ...oldData.data, data: updatedProducts } };
              if (oldData.data) return { ...oldData, data: updatedProducts };
              return updatedProducts;
            });
          } catch (cacheErr) {
            console.error('⚠️ [POSInterface] Optimistic cache update failed:', cacheErr);
          }

          // 2. BACKGROUND REFRESH: Trigger real refetch to ensure data integrity
          refetchProducts();
          
          // DO NOT navigate - stay on POS Terminal
          console.log('✅ [POSInterface] Sale completed, staying on terminal.');
          toast.success("Sale completed and receipt triggered.", "Checkout Success");
        } else {
          console.error('❌ [POSInterface] Sale response missing data:', res);
          const errorMsg = res?.message || 'Unable to complete sale';
          setError(errorMsg);
          toast.error(errorMsg, "Checkout Failed");
        }
      } else {
        // OFFLINE MODE - Save to IndexedDB and redirect to receipt page
        console.log('🔴 [POSInterface] OFFLINE MODE - Saving sale locally...');

        const newOfflineCount = offlineSyncCount + 1;
        setOfflineSyncCount(newOfflineCount);
        localStorage.setItem('pos-offline-count', newOfflineCount.toString());

        // 🔀 INTERLEAVING: Ensure offline sales follow the same (Sequence - 1) * Total + Lane rule.
        // Simplest way: Next Invoice = Previous Invoice + TotalLanes
        let nextSeq: number;
        if (lastSequence > 0) {
          nextSeq = lastSequence + totalLanes;
        } else {
          // First sale ever on this terminal
          nextSeq = terminalLane;
        }
        
        // Update local sequence for the next offline sale
        setLastSequence(nextSeq);
        localStorage.setItem('pos-last-sequence', nextSeq.toString());

        const tempId = `OFF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const invoiceNumber = String(nextSeq).padStart(6, '0');

        // Capture payment values IMMEDIATELY to prevent zeroing out
        const finalReceived = Number(receivedAmount) || 0;
        const finalChange = Math.max(0, finalReceived - total);

        const offlineSale: OfflineSale = {
          tempId,
          invoiceNumber,
          deviceId,
          paymentMethod,
          discountAmount: numericDiscountAmount,
          notes: notes || undefined,
          receivedAmount: paymentMethod === 'CASH' ? finalReceived : undefined,
          changeAmount: paymentMethod === 'CASH' ? finalChange : undefined,
          items: payload.items,
          totals: { subtotal, tax, total },
          createdAt: new Date().toISOString(),
          syncStatus: 'PENDING',
          retryCount: 0,
        };

        // Save to IndexedDB
        await offlineStorage.saveSale(offlineSale);
        console.log('✅ [OfflineStorage] Sale saved locally:', tempId);

        // 1. OPTIMISTIC UPDATE: Update local products cache immediately for instant UI feedback
        try {
          const queryKey = ['pos-products'];
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData) return oldData;
            
            // Handle different API response structures
            const products = oldData.data?.data || oldData.data || oldData;
            if (!Array.isArray(products)) return oldData;
            
              const updatedProducts = products.map((p: any) => {
                const cartItem = cart.find(item => item.id === p.id);
                if (cartItem) {
                  const currentQty = p.inventoryStock?.totalQuantity || 0;
                  const newTotalQty = Math.max(0, currentQty - cartItem.quantity);
                  
                  let remainingToDeduct = cartItem.quantity;
                  const newBatches = (p.activeBatches || []).map((b: any) => {
                    if (remainingToDeduct <= 0) return b;
                    const take = Math.min(b.quantityRemaining, remainingToDeduct);
                    remainingToDeduct -= take;
                    return { ...b, quantityRemaining: b.quantityRemaining - take };
                  }).filter((b: any) => b.quantityRemaining > 0);

                  return {
                    ...p,
                    activeBatches: newBatches,
                    sellingPrice: newBatches[0]?.sellingPrice ?? p.sellingPrice,
                    inventoryStock: {
                      ...p.inventoryStock,
                      totalQuantity: newTotalQty
                    }
                  };
                }
                return p;
              });
            
            // Re-wrap in original structure
            if (oldData.data?.data) return { ...oldData, data: { ...oldData.data, data: updatedProducts } };
            if (oldData.data) return { ...oldData, data: updatedProducts };
            return updatedProducts;
          });
        } catch (cacheErr) {
          console.error('⚠️ [POSInterface] Optimistic cache update failed:', cacheErr);
        }

        // 2. BACKGROUND REFRESH: Trigger real refetch to ensure data integrity
        refetchProducts();

        // Clear cart
        setCart([]);
        setDiscountValue(0);
        setPaymentMethod('CASH');
        setReceivedAmount('');
        setNotes('');

        // Store sale in sessionStorage for instant access
        sessionStorage.setItem(`offline-sale-${tempId}`, JSON.stringify(offlineSale));

        // Trigger direct print by updating state
        console.log('🖨️ [POSInterface] Preparing direct print for offline sale...');
        setLastSaleForReceipt({
          ...offlineSale,
          id: tempId,
          receivedAmount: finalReceived,
          changeAmount: finalChange,
          saleItems: offlineSale.items.map((item: any) => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.totalPrice,
            taxPercentage: item.taxPercentage || 0,
          })),
        });

        // DO NOT navigate - stay on POS Terminal
        console.log('✅ [POSInterface] Offline sale completed, staying on terminal.');
        toast.info("Offline sale saved locally. It will sync when online.", "Offline Recorded");
      }
    } catch (err: any) {
      console.error('❌ [POSInterface] Sale error:', err);
      
      // Extract error message from backend response
      let msg = 'Failed to complete sale';
      if (err.response?.data) {
        const backendData = err.response.data;
        msg = backendData.message || backendData.error || msg;
      }
      
      setError(msg);
      toast.error(msg, "Checkout Failed");
    } finally {
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

    // PERFORMANCE OPTIMIZATION: Limit rendered products to 100
    // This prevents browser lockup while still allowing the user to find 
    // any product via the search/filters.
    return result.slice(0, 100);
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
    <div className="w-full overflow-hidden">
      <div className="flex flex-col h-screen max-h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-900 shadow-sm transition-colors duration-500 m-0">
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

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left: Product Selection */}
          <section className="flex-[1.2] flex flex-col min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 bg-white dark:bg-slate-900">
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

            {/* Products Table Section */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Filters (Pinned at top) */}
              <div className="flex-shrink-0 p-4 border-b border-slate-100 bg-white">
                <ProductsFilters
                  searchQuery={productSearch}
                  setSearchQuery={setProductSearch}
                  selectedCategory={productCategory}
                  setSelectedCategory={setProductCategory}
                  stockFilter={productStockFilter}
                  setStockFilter={setProductStockFilter}
                  categories={categories}
                  onReset={handleResetFilters}
                  onRefresh={() => refetchProducts()}
                  isRefreshing={productsFetching}
                />
              </div>

              {/* Table (Scrollable area) */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-2 py-1">
                <ProductsTable
                  products={filteredProducts}
                  loading={productsLoading}
                  onAddToCart={handleAddProductToCart}
                  cart={cart}
                />
              </div>
            </div>

          

            {/* Internal Footer for Left Section: Hold Orders */}
            <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50">
{/* Hold Orders Section */}
      {holdOrders.length > 0 && (
        <div className="p-4 animate-in slide-in-from-top duration-500 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3 px-2 flex-shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Clock size={14} className="text-indigo-500" />
              Hold Orders <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-full text-[9px] ml-1">{holdOrders.length}</span>
            </h3>
          </div>
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex gap-3 min-w-max">
              {holdOrders.map((order) => (
                <div
                  key={order.id}
                  className="w-[200px] p-3.5 rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full -mr-8 -mt-8"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.id.split('-').pop()}</span>
                      <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-lg">
                        {order.items.length} ITEMS
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeOrder(order.id)}
                        className="flex-1 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHoldOrder(order.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </section>

    {/* Right: Added Products & Active Checkout Stack */}
    <aside className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-white dark:bg-slate-900 overflow-hidden flex-shrink-0 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
      <div className="flex-1 flex flex-col overflow-hidden border-b border-slate-200">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
                <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                  <ShoppingCart size={15} className="text-blue-600" />
                  Added Products
                </h3>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {cart.length}
                </span>
              </div>

              <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10 px-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <ShoppingCart size={24} className="opacity-20 text-slate-900 dark:text-white" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 text-center">Your cart is currently empty</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                      <tr>
                        <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500">Product</th>
                        <th className="px-2 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Price</th>
                        <th className="px-2 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Qty</th>
                        <th className="px-2 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right">Subtotal</th>
                        <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest text-slate-500 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cart.map((item) => (
                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-3 py-3 align-top min-w-[140px]">
                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                              {item.name}
                            </p>
                            <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                              ID: {item.id.slice(-8)}
                            </p>
                          </td>
                          <td className="px-2 py-3 align-top text-center font-black text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
                            {formatAmount(item.price)}
                            {(item.activeBatches?.length || 0) > 1 && item.quantity > (item.activeBatches?.[0].quantityRemaining || 0) && (
                                <div className="text-[7px] text-blue-500 uppercase mt-0.5 leading-none">
                                    Multi-Batch<br/>Pricing Applied
                                </div>
                            )}
                          </td>
                          <td className="px-2 py-3 align-top text-center">
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-rose-600 transition-colors"
                                >
                                  <Minus size={10} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleDirectQuantityChange(item.id, e.target.value)}
                                  className="w-8 bg-transparent text-center text-[11px] font-black text-slate-900 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 align-top text-right font-black text-[12px] text-blue-600 dark:text-blue-400 tabular-nums">
                            {formatAmount(calculateLineDetails(item).subtotal)}
                          </td>
                          <td className="px-3 py-3 align-top text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all ml-auto"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Bottom: Active Cart Totals & Checkout */}
            <div className="flex-shrink-0 max-h-[60%] overflow-y-auto bg-white border-t border-slate-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] custom-scrollbar">
              <div className="px-4 py-2 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Tax (GST)</span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(tax)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Discount</span>
                <span className="font-bold text-slate-900">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
              <hr className="my-1 border-dashed border-slate-200" />
              <div className="flex justify-between items-center text-[15px] font-black py-1">
                <span className="flex items-center space-x-1 text-slate-900">
                  <Banknote size={18} className="text-blue-600" />
                  <span className="tracking-tighter">TOTAL</span>
                </span>
                <span className="text-slate-950 font-black text-lg tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Discount controls */}
            <div className="px-4 py-1.5 border-t border-slate-100 space-y-1.5 text-[9px]">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDiscountMode('amount')}
                  className={`flex-1 inline-flex items-center justify-center space-x-1 rounded-lg border px-2 py-0.5 font-bold uppercase tracking-widest ${
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
                  className={`flex-1 inline-flex items-center justify-center space-x-1 rounded-lg border px-2 py-0.5 font-bold uppercase tracking-widest ${
                    discountMode === 'percent'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 bg-white'
                  }`}
                >
                  <Percent size={10} />
                  <span>Percent</span>
                </button>
              </div>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  min={0}
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-400"
                  placeholder={discountMode === 'amount' ? 'Rs. amount' : '% value'}
                />
                <span className="text-[11px] text-slate-500 font-semibold">
                  APPLY
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
            <div className="px-4 py-1.5 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center space-x-1">
                  <CreditCard size={10} />
                  <span>Method</span>
                </div>
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
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${
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

              <div className="mt-2">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  <span>Customer Notes</span>
                  <span className="text-slate-400">(optional)</span>
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Customer notes..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-900 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Received Amount & Change Calculation */}
            {paymentMethod === 'CASH' && cart.length > 0 && (
              <div className="px-4 py-1.5 border-t border-slate-100 space-y-1.5 bg-slate-50/30">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  <span>Payment Details</span>
                </div>

                {/* Received Amount Input */}
                <div>
                  <label className="text-[10px] font-bold text-slate-600 mb-0.5 block">
                    Amount Received
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="Enter amount received"
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-100 focus:border-emerald-400"
                  />
                </div>

                {/* Change Display */}
                {receivedAmount && (
                  <div className={`rounded-lg p-2 border ${
                    hasInsufficientAmount
                      ? 'bg-red-50 border-red-200'
                      : hasExactAmount
                      ? 'bg-blue-50 border-blue-200'
                      : hasChange
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Bill Total
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        Received
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {formatCurrency(receivedAmountNum)}
                      </span>
                    </div>
                    <hr className={`my-1 border-dashed ${
                      hasInsufficientAmount
                        ? 'border-red-200'
                        : hasExactAmount
                        ? 'border-blue-200'
                        : hasChange
                        ? 'border-emerald-200'
                        : 'border-slate-200'
                    }`} />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                        {hasInsufficientAmount ? 'Shortage' : hasExactAmount ? 'Status' : 'Change'}
                      </span>
                      <span className={`text-[13px] font-black ${
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
                      <div className="mt-1 flex items-center space-x-1 text-[9px] text-red-600 font-bold">
                        <AlertCircle size={10} />
                        <span>Insufficient amount received</span>
                      </div>
                    )}
                    {hasExactAmount && (
                      <div className="mt-1 flex items-center space-x-1 text-[9px] text-slate-900 font-bold">
                        <CheckCircle size={10} />
                        <span>Exact amount paid</span>
                      </div>
                    )}
                    {hasChange && (
                      <div className="mt-1 flex items-center space-x-1 text-[9px] text-slate-900 font-bold">
                        <CheckCircle size={10} />
                        <span>Return to customer</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

              </div>

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleHoldOrder}
                    disabled={!cart.length}
                    className="flex-1 rounded-lg border border-blue-200 bg-blue-50/50 px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock size={12} />
                    <span>HOLD</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
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
                    className={`flex-[1.5] rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${
                      !canCompleteSale || isSubmitting
                        ? 'bg-blue-400 text-white/50 cursor-not-allowed'
                        : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    <CreditCard size={12} />
                    <span>{isSubmitting ? 'Wait...' : 'CHECKOUT'}</span>
                  </button>
                </div>
              </div>
          </aside>
        </div>
      </div>
      </div>
      
      
      {/* Hidden Receipt for direct thermal printing */}
      <ThermalReceipt sale={lastSaleForReceipt} />
    </div>
);
};

export default POSInterface;
