import React, { useState } from 'react';
import { Package, AlertTriangle, XCircle, RefreshCcw } from 'lucide-react';
import InventoryDisplay from '../../components/cashier/InventoryDisplay';
import PageHeader from '../../components/global-components/PageHeader';
import { cn } from '@/lib/utils';

type ViewMode = 'all' | 'low-stock' | 'out-of-stock';

const InventoryCheckPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Inventory Check"
        description="Monitor real-time stock levels and availability"
        primaryAction={{
          label: "Refresh Data",
          icon: RefreshCcw,
          onClick: handleRefresh
        }}
        icon={Package}
      />

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
        {/* View Mode Tabs */}
        <div className="flex items-center space-x-2 mb-8 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              viewMode === 'all'
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <Package size={14} />
              All Items
            </span>
          </button>

          <button
            onClick={() => setViewMode('low-stock')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              viewMode === 'low-stock'
                ? "bg-amber-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} />
              Low Stock
            </span>
          </button>

          <button
            onClick={() => setViewMode('out-of-stock')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              viewMode === 'out-of-stock'
                ? "bg-rose-600 text-white shadow-lg"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <span className="flex items-center gap-2">
              <XCircle size={14} />
              Out of Stock
            </span>
          </button>
        </div>

        {/* Inventory Display Component */}
        <div className="flex-1" key={refreshKey}>
          <InventoryDisplay
            showLowStockOnly={viewMode === 'low-stock'}
            showOutOfStockOnly={viewMode === 'out-of-stock'}
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryCheckPage;
