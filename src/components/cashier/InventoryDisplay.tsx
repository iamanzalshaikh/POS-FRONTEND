import React, { useEffect, useState, useCallback } from 'react';
import { Package, AlertTriangle, XCircle, Loader2, RefreshCcw } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { fetchFullInventory, fetchLowStockInventory } from '../../api/inventory.api';
import { DataTable } from '../global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { formatNumberShort } from '@/utils/format';

interface InventoryItem {
  id: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    reorderLevel?: number;
  };
  name?: string;
  totalQuantity?: number;
  quantity?: number;
  sku?: string;
  reorderLevel?: number;
}

interface InventoryDisplayProps {
  showLowStockOnly?: boolean;
  showOutOfStockOnly?: boolean;
  compact?: boolean;
  onRefresh?: () => void;
}

/**
 * InventoryDisplay Component
 *
 * Displays inventory items fetched from the API with proper loading and error states.
 * Supports filtering for low stock and out of stock items.
 *
 * Features:
 * - Automatic data fetching on mount
 * - Loading skeleton state
 * - Error handling
 * - Stock status badges (Low/Out of Stock)
 * - Refresh button for manual updates
 */
const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  showLowStockOnly = false,
  showOutOfStockOnly = false,
  compact = false,
  onRefresh,
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use appropriate API endpoint based on filters
      const fetchFn = showLowStockOnly ? fetchLowStockInventory : fetchFullInventory;
      const res = await fetchFn();
      console.log('📦 InventoryDisplay - Raw response:', res);

      // fetchFullInventory/fetchLowStockInventory returns res.data which is { success, data: [...], message }
      let items: InventoryItem[] = [];
      if (res?.success && Array.isArray(res.data)) {
        items = res.data;
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        items = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        items = res.data;
      } else if (Array.isArray(res)) {
        items = res;
      }

      console.log('📦 InventoryDisplay - Parsed', items.length, 'items');
      setInventory(items);
    } catch (err: any) {
      console.error('[InventoryDisplay] Error:', err);
      setError(err.response?.data?.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  }, [showLowStockOnly]);

  useEffect(() => {
    loadInventory();
  }, [showLowStockOnly]);

  // Real-time stock updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    socket.on('inventory:updated', (data: any) => {
      console.log('📡 [InventoryDisplay] Inventory update received:', data);
      loadInventory();
    });

    return () => {
      socket.off('inventory:updated');
    };
  }, [socket, loadInventory]);

  const handleRefresh = async () => {
    await loadInventory();
    if (onRefresh) {
      onRefresh();
    }
  };

  // Helper to extract item name
  const getItemName = (item: InventoryItem): string => {
    return item.product?.name || item.name || 'Unknown Product';
  };

  // Helper to extract stock quantity
  const getStock = (item: InventoryItem): number => {
    return Number(item.totalQuantity ?? item.quantity ?? 0);
  };

  // Helper to extract reorder level
  const getReorderLevel = (item: InventoryItem): number => {
    return Number(item.product?.reorderLevel ?? item.reorderLevel ?? 0);
  };

  // Filter logic
  let displayItems = inventory;

  // Only filter for out-of-stock if requested (low stock is already filtered by API)
  if (showOutOfStockOnly) {
    displayItems = inventory.filter((item) => getStock(item) <= 0);
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">{error}</p>
          <button
            onClick={handleRefresh}
            className="text-xs text-red-600 hover:text-red-800 font-medium mt-1 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (displayItems.length === 0) {
    let emptyMessage = 'No items found';
    let emptyDescription = '';

    if (showLowStockOnly) {
      emptyMessage = 'No Low Stock Items';
      emptyDescription = 'All items are well stocked. Great job!';
    } else if (showOutOfStockOnly) {
      emptyMessage = 'No Out of Stock Items';
      emptyDescription = 'All items are available.';
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package size={40} className="text-slate-300 mb-3" />
        <p className="text-base font-semibold text-slate-700">{emptyMessage}</p>
        {emptyDescription && (
          <p className="text-sm text-slate-500 mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  if (compact) {
    // Compact list view for sidebars/widgets
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Inventory Items ({displayItems.length})
          </h3>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-slate-100 rounded"
            title="Refresh inventory"
          >
            <RefreshCcw size={14} className="text-slate-500" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {displayItems.slice(0, 20).map((item) => {
            const stock = getStock(item);
            const threshold = getReorderLevel(item);
            const isLowStock = stock > 0 && stock <= threshold;
            const isOutOfStock = stock <= 0;

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded border border-slate-200 bg-white hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {getItemName(item)}
                  </p>
                  {item.product?.sku && (
                    <p className="text-xs text-slate-500">{item.product.sku}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-2">
                  <span
                    className={`text-xs font-bold ${
                      isOutOfStock
                        ? 'text-red-600'
                        : isLowStock
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {stock}
                  </span>
                  {isOutOfStock && <XCircle size={14} className="text-red-500" />}
                  {isLowStock && !isOutOfStock && <AlertTriangle size={14} className="text-amber-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      header: "ID",
      cell: ({ row }) => (
        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
          {(row.index + 1).toString().padStart(2, '0')}
        </div>
      )
    },
    {
      header: "Product",
      cell: ({ row }) => (
        <div className="text-center">
          <p className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-tight truncate">
            {getItemName(row.original)}
          </p>
        </div>
      )
    },
    {
      header: "SKU",
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px]">
            {row.original.product?.sku || row.original.sku || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: "Stock",
      cell: ({ row }) => {
        const stock = getStock(row.original);
        const threshold = getReorderLevel(row.original);
        const isLow = stock > 0 && stock <= threshold;
        const isOut = stock <= 0;
        return (
          <div className="text-center">
            <span className={cn(
              "text-[11px] font-black uppercase tracking-widest tabular-nums",
              isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-emerald-600"
            )}>
              {formatNumberShort(stock)} UNITS
            </span>
          </div>
        );
      }
    },
    {
      header: "Reorder",
      cell: ({ row }) => (
        <div className="text-center text-slate-400 text-[10px] font-black uppercase tracking-widest tabular-nums">
          {getReorderLevel(row.original)}
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const stock = getStock(row.original);
        const threshold = getReorderLevel(row.original);
        const isLow = stock > 0 && stock <= threshold;
        const isOut = stock <= 0;
        return (
          <div className="flex justify-center text-center">
            <span className={cn(
              "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
              isOut ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
              isLow ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
              "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
            )}>
              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
            </span>
          </div>
        );
      }
    }
  ];

  // Full table view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package size={20} className="text-emerald-500" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">Inventory Items</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total items: {displayItems.length}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center space-x-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
          <span>Refresh List</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={displayItems}
          isLoading={loading}
          onRefresh={handleRefresh}
          hidePagination={true}
          manualPagination={false}
          maxHeight="calc(100vh - 450px)"
          placeholder="Search inventory items..."
        />
      </div>
    </div>
  );
};

export default InventoryDisplay;
