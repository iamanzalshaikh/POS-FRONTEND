import React from 'react';
import { Package, Plus, AlertCircle } from 'lucide-react';

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

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  onAddToCart,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="py-12 text-center text-slate-400">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-bold">Loading products...</p>
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Product
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                SKU
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Category
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Price
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Stock
              </th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const stock = product.inventoryStock?.totalQuantity ?? product.stock ?? 0;
              const price = Number(product.sellingPrice ?? product.price ?? 0);
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= 5;
              const category = product.category?.name || product.category || 'N/A';

              return (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {product.sku || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-base font-black text-slate-900">
                      ₨ {price.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700">
                        <AlertCircle className="w-3 h-3" />
                        Out
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                        <AlertCircle className="w-3 h-3" />
                        {stock}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                        {stock}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={isOutOfStock}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTable;
