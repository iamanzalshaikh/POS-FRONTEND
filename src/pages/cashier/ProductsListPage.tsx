import React, { useEffect, useState, useMemo } from 'react';
import { Package, RefreshCcw, AlertCircle } from 'lucide-react';
import { fetchProducts } from '../../api/products.api';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Product type matching the backend response from GET /products
 * Based on Prisma schema with category and inventoryStock included
 */
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

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      if (res.data?.success && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      } else {
        setProducts([]);
      }
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

  // Format price as INR currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Get stock quantity from inventoryStock relation
  const getStockQuantity = (product: Product) => {
    return product.inventoryStock?.totalQuantity ?? 0;
  };

  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      accessorKey: "index",
      header: "Ref ID",
      cell: ({ row }) => <span className="font-mono text-[11px] text-slate-300 font-medium tracking-tighter">{(row.index + 1).toString().padStart(4, '0')}</span>,
    },
    {
      accessorKey: "name",
      header: "Product Detail",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-900 dark:text-white leading-tight">{product.name}</span>
            <span className="text-[11px] text-slate-400 mt-0.5">{product.sku || 'NO-SKU'}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest rounded-lg px-4 py-1.5 min-w-[90px]">
            {row.original.category?.name || 'General'}
          </div>
        </div>
      )
    },
    {
      accessorKey: "sellingPrice",
      header: "Inventory Value",
      cell: ({ row }) => (
        <span className="text-sm font-black text-slate-900 dark:text-white">
          {formatPrice(row.getValue("sellingPrice"))}
        </span>
      )
    },
    {
      id: "stock",
      header: "Stock Level",
      cell: ({ row }) => {
        const stock = getStockQuantity(row.original);
        return (
          <div className="flex justify-center">
            <div className={`bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-bold text-[11px] rounded-lg px-5 py-1.5 min-w-[70px] ${stock <= 0 ? 'text-rose-500' : stock <= 10 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
              {stock.toString().padStart(2, '0')}
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("isActive");
        return (
          <div className="flex justify-center">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${active ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'
              }`}>
              {active ? 'Active' : 'Inactive'}
            </div>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="min-h-[520px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package size={20} className="text-emerald-500" />
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Products Catalog
            </h1>
            <p className="text-xs text-slate-500">
              Browse all available products in your store.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle size={40} className="text-rose-500" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Failed to load products</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
            <button
              onClick={loadProducts}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <DataTable
            columns={columns}
            data={products}
            isLoading={loading}
            searchKey="name"
            placeholder="Search products by name, SKU..."
          />
        </div>
      )}
    </div>
  );
};

export default ProductsListPage;
