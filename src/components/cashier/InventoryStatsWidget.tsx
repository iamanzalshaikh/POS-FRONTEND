import React, { useEffect, useState } from 'react';
import { Package, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { fetchFullInventory } from '../../api/inventory.api';

interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface InventoryStatsWidgetProps {
  onStatsUpdate?: (stats: InventoryStats) => void;
}

/**
 * InventoryStatsWidget Component
 * 
 * Displays quick inventory statistics for the cashier dashboard.
 * Shows counts for:
 * - Total inventory items
 * - Items in stock
 * - Low stock items
 * - Out of stock items
 * 
 * Features:
 * - Auto-loads on mount
 * - Compact card layout
 * - Color-coded status badges
 * - Optional callback for stats updates
 */
const InventoryStatsWidget: React.FC<InventoryStatsWidgetProps> = ({ onStatsUpdate }) => {
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFullInventory();

      if (res?.success) {
        const invData = res.data;
        const items = Array.isArray(invData) ? invData : (invData?.data || []);
        
        let inStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        items.forEach((item: any) => {
          const stock = Number(item.totalQuantity ?? item.quantity ?? 0);
          const threshold = Number(item.product?.reorderLevel ?? item.reorderLevel ?? 0);

          if (stock <= 0) {
            outOfStockCount++;
          } else if (stock <= threshold) {
            lowStockCount++;
          } else {
            inStockCount++;
          }
        });

        const newStats: InventoryStats = {
          totalItems: items.length,
          inStock: inStockCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
        };

        setStats(newStats);
        if (onStatsUpdate) {
          onStatsUpdate(newStats);
        }
      }
    } catch (err: any) {
      console.error('[InventoryStatsWidget] Error:', err);
      setError('Failed to load inventory stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Items */}
      <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Total Items
          </span>
          <Package size={16} className="text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-blue-900">{stats.totalItems}</div>
        <p className="text-xs text-blue-600 mt-1">products in inventory</p>
      </div>

      {/* In Stock */}
      <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            In Stock
          </span>
          <Package size={16} className="text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-emerald-900">{stats.inStock}</div>
        <p className="text-xs text-emerald-600 mt-1">available to sell</p>
      </div>

      {/* Low Stock */}
      <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Low Stock
          </span>
          <AlertTriangle size={16} className="text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-amber-900">{stats.lowStock}</div>
        <p className="text-xs text-amber-600 mt-1">need reordering</p>
      </div>

      {/* Out of Stock */}
      <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-br from-red-50 to-red-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">
            Out of Stock
          </span>
          <XCircle size={16} className="text-red-500" />
        </div>
        <div className="text-2xl font-bold text-red-900">{stats.outOfStock}</div>
        <p className="text-xs text-red-600 mt-1">unavailable</p>
      </div>
    </div>
  );
};

export default InventoryStatsWidget;
