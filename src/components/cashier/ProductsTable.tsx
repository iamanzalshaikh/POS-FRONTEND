import React, { useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Package, Info, AlertCircle } from "lucide-react";
import { formatAmount } from "../../utils/expense-utils";

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
  unitType?: string;
  unitQuantity?: number;
}

interface CartItem {
  id: string;
  quantity: number;
  totalStock?: number;
}

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
  cart?: CartItem[];
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  onAddToCart,
  cart = [],
}) => {
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        header:() => <div className="text-center">Product </div>,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex flex-col items-center py-2">
              <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {product.name}
              </div>
              
            </div>
          );
        },
      },
      {
        accessorKey: "sellingPrice",
        header: "Selling Price",
        cell: ({ row }) => {
          const product = row.original;
          const price = Number(product.sellingPrice ?? product.price ?? 0);
          return (
            <span className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums">
              {formatAmount(price)}
            </span>
          );
        },
      },
      {
        accessorKey: "unitType",
        header: "Unit",
        cell: ({ row }) => {
          const product = row.original;
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800/50 whitespace-nowrap">
            {product.unitQuantity} {product.unitType || "PIECE"} 
            </span>
          );
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const product = row.original;
          const totalStock = product.inventoryStock?.totalQuantity ?? product.stock ?? 0;
          const cartQty = cart.find((item) => item.id === product.id)?.quantity ?? 0;
          const availableStock = Math.max(0, totalStock - cartQty);
          
          const isOutOfStock = availableStock <= 0;
          const isLowStock = availableStock > 0 && availableStock <= 5;

          return (
            <div className="flex flex-col items-center gap-1">
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
                  isOutOfStock 
                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 shadow-sm shadow-rose-100/50" 
                    : isLowStock
                    ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 shadow-sm shadow-amber-100/50"
                    : "bg-orange-50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800/50 shadow-sm shadow-orange-50/50"
                }`}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[11px] font-black tabular-nums">{availableStock}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter opacity-80">Units</span>
                </div>
              </div>
              {cartQty > 0 && (
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter animate-pulse">
                  {cartQty} Selected
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const product = row.original;
          const totalStock = product.inventoryStock?.totalQuantity ?? product.stock ?? 0;
          const cartQty = cart.find((item) => item.id === product.id)?.quantity ?? 0;
          const availableStock = Math.max(0, totalStock - cartQty);
          const isOutOfStock = availableStock <= 0;

          return (
            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`group flex items-center justify-center gap-2 w-full max-w-[100px] mx-auto py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${
                isOutOfStock
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-blue-300 active:scale-95 border border-blue-500"
              }`}
            >
              <Plus size={14} className={isOutOfStock ? "" : "group-hover:rotate-90 transition-transform duration-300"} />
              <span className="hidden sm:inline">{isOutOfStock ? "Limit" : "Add"}</span>
            </button>
          );
        },
      },
    ],
    [cart, onAddToCart]
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="w-full space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 m-4">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Package size={32} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Products Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
          Try adjusting your search or filters to find products.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <table className="w-full min-w-[600px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500"
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all duration-300"
              >
                {row.getVisibleCells().map((cell, index) => (
                  <td
                    key={cell.id}
                    className={`px-2 py-3 align-middle ${
                      index === 0 ? "text-left" : index === 4 ? "text-right" : "text-center"
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table Legend/Info */}
      <div className="flex items-center justify-between mt-3 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Out of Stock</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 italic">
          <Info size={12} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Pricing includes applicable taxes</span>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
