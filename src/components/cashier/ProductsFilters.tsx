import React from 'react';
import { Search, Package, Plus, RefreshCw, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku?: string;
  sellingPrice?: number;
  price?: number;
  stock?: number;
  isActive?: boolean;
  category?: any;
  inventoryStock?: { totalQuantity?: number };
  discountPercentage?: number;
}

interface ProductsFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  stockFilter: string;
  setStockFilter: (filter: string) => void;
  categories: string[];
  onReset: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ProductsFilters: React.FC<ProductsFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  stockFilter,
  setStockFilter,
  categories,
  onReset,
  onRefresh,
  isRefreshing = false,
}) => {
  const hasActiveFilters = searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Stock Filter (Consolidated) */}
        <div className="w-full md:w-36">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-[#1e293b] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
          >
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-200 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 hover:text-blue-600 rounded-xl transition-all shadow-sm active:scale-95 disabled:bg-slate-50 disabled:text-slate-300"
              title="Sync Stock Registry"
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          )}

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="px-4 py-2.5 bg-[#1e293b] hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md active:scale-95"
            >
              <X size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Scroll */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>
    </div>

  );
};

export default ProductsFilters;
