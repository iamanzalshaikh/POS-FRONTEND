import React from "react";
import { Package, Plus, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden p-20 shadow-none">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
            Synchronizing Product Registry...
          </p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="py-12 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold">No products found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm transition-colors duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-5 px-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] min-w-[200px]">
                  Product Description
                </th>
                <th className="text-center py-5 px-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] min-w-[120px]">
                  Selling Price
                </th>
                <th className="text-center py-5 px-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] min-w-[100px]">
                  Unit
                </th>
                <th className="text-center py-5 px-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] min-w-[100px]">
                  Stock
                </th>
                <th className="text-right py-5 px-6 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] min-w-[100px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedProducts.map((product) => {
                const totalStock = product.inventoryStock?.totalQuantity ?? product.stock ?? 0;
                const cartQty = cart.find(item => item.id === product.id)?.quantity ?? 0;
                const availableStock = Math.max(0, totalStock - cartQty);
                
                const price = Number(product.sellingPrice ?? product.price ?? 0);
                const isOutOfStock = availableStock <= 0;
                const isLowStock = availableStock > 0 && availableStock <= 5;

                return (
                  <tr
                    key={product.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300"
                  >
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                          {product.name}
                        </span>
                        
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className="text-sm font-black text-[#1e293b] dark:text-slate-200 tabular-nums">
                        {price.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                      {product.unitQuantity}  {product.unitType || "PIECE"} 
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                          {totalStock > 0 ? "Cart Limit Reached" : "Out of Stock"}
                        </span>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            isLowStock 
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50" 
                              : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                          }`}>
                            {availableStock} UNITS
                          </span>
                          {cartQty > 0 && (
                            <span className="text-[8px] font-bold text-blue-500 mt-1">({cartQty} in cart)</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-6 text-right">
                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
