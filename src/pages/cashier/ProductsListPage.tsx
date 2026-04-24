import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Search, RefreshCcw, ShoppingCart, Box, AlertTriangle } from 'lucide-react';
import { fetchProducts } from '../../api/products.api';
import { formatCurrency, formatCurrencyShort, formatNumberShort } from '@/utils/format';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/skeletons/TableSkeleton';
import { useSocket } from '../../hooks/useSocket';

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
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Real-time stock updates
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;

    socket.on('inventory:updated', (data: any) => {
      console.log('📡 [ProductsList] Inventory update received:', data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    });

    return () => {
      socket.off('inventory:updated');
    };
  }, [socket, queryClient]);

  // Combined Query
  const { data: productsRes, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
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
      return productList;
    },
    staleTime: 1000 * 60 * 5,
  });

  const products = productsRes || [];

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const getStockQuantity = (product: Product) => {
    return product.inventoryStock?.totalQuantity ?? 0;
  };

  const columns: ColumnDef<Product>[] = [
    {
      header: "ID",
      cell: ({ row }) => (
        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
          {(row.index + 1).toString().padStart(2, '0')}
        </div>
      )
    },
    {
      header: "Product Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="text-center">
          <p className="text-sm font-black text-[#1e293b] dark:text-white transition-colors uppercase tracking-tight truncate">
            {row.original.name}
          </p>
        </div>
      )
    },
    {
      header: "SKU",
      accessorKey: "sku",
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[2px]">
            {row.original.sku || 'N/A'}
          </span>
        </div>
      )
    },
    {
      header: "Category",
      cell: ({ row }) => (
        <div className="text-center">
          <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-[2px] border border-slate-100 dark:border-slate-800">
            {row.original.category?.name || 'General'}
          </span>
        </div>
      )
    },
    {
      header: "Selling",
      accessorKey: "sellingPrice",
      cell: ({ row }) => (
        <div className="text-center text-[#1e293b] dark:text-slate-300 text-[11px] font-black uppercase tracking-widest tabular-nums">
          {formatCurrencyShort(row.original.sellingPrice)}
        </div>
      )
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <div className="flex justify-center text-center">
          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
            row.original.isActive 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50" 
              : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
          )}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      header: "In Stock",
      cell: ({ row }) => {
        const stock = getStockQuantity(row.original);
        return (
          <div className="flex justify-center text-center">
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[2px] border",
              stock === 0 ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50" :
              stock <= 10 ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/50" :
              "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50"
            )}>
              {formatNumberShort(stock)} UNITS
            </span>
          </div>
        );
      }
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
          onClick: () => refetch()
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
          colorClass="bg-amber-50 text-amber-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        {isLoading && products.length === 0 ? (
          <TableSkeleton columns={7} rows={10} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={isLoading}
            onRefresh={() => refetch()}
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
        )}
      </div>
    </div>
  );
};

export default ProductsListPage;
