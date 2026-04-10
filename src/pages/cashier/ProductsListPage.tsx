import React, { useEffect, useState } from 'react';
import { Package, Search, RefreshCcw, ShoppingCart, Box, AlertTriangle } from 'lucide-react';
import { fetchProducts } from '../../api/products.api';
import { formatCurrency } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  taxPercentage?: number;
  isActive: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  inventoryStock?: {
    totalQuantity: number;
  };
  createdAt: string;
  updatedAt: string;
}

const ProductsListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      let productList: Product[] = [];
      if (res?.success && Array.isArray(res.data)) {
        productList = res.data;
      } else if (res?.data?.data && Array.isArray(res.data.data)) {
        productList = res.data.data;
      } else if (res?.data && Array.isArray(res.data)) {
        productList = res.data;
      } else if (Array.isArray(res)) {
        productList = res;
      }
      setProducts(productList);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load products';
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockQuantity = (product: Product) => {
    return product.inventoryStock?.totalQuantity ?? 0;
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: "Product Details",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700">
            <Box size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.name}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">SKU: {row.original.sku || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: "Category",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
            {row.original.category?.name || 'General'}
          </span>
        </div>
      )
    },
    {
      header: "Selling Price",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-sm font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrency(row.original.sellingPrice)}
        </div>
      )
    },
    {
      header: "In Stock",
      cell: ({ row }) => {
        const stock = getStockQuantity(row.original);
        return (
          <div className="flex justify-center">
            <span className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm inline-flex items-center gap-2",
              stock === 0 ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
              stock <= 10 ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
              "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", stock === 0 ? "bg-rose-500" : stock <= 10 ? "bg-amber-500" : "bg-emerald-500")} />
              {stock} Units
            </span>
          </div>
        )
      }
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className={cn(
            "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
            row.original.isActive 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
              : "bg-slate-100 text-slate-500 border-slate-200"
          )}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Products Catalog"
        description="Browse all available products in your store"
        primaryAction={{
          label: "Refresh List",
          icon: RefreshCcw,
          onClick: loadProducts
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total Products"
          value={String(products.length)}
          icon={ShoppingCart}
          colorClass="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
        <MetricCard
          title="Active Products"
          value={String(products.filter(p => p.isActive).length)}
          icon={Package}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Low Stock"
          value={String(products.filter(p => getStockQuantity(p) <= 10).length)}
          icon={AlertTriangle}
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={columns}
          data={filteredProducts}
          isLoading={loading}
          onRefresh={loadProducts}
          placeholder="Search catalog by name, sku, or barcode..."
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[320px]"
                />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ProductsListPage;
