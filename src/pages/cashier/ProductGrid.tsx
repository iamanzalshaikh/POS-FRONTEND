import React from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

type Product = {
  id: string;
  name: string;
  sellingPrice?: number;
  price?: number;
  stock?: number;
};

type ProductGridProps = {
  products: Product[];
  onAddToCart: (product: Product) => void;
  loading: boolean;
  error: string | null;
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-500">
        No products available to display.
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto h-full">
      {products.map((product) => {
        const stock = (product as any).inventoryStock?.totalQuantity ?? product.stock ?? 0;
        const price = Number(product.sellingPrice ?? product.price ?? 0);

        return (
          <div
            key={product.id}
            className="relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="p-3 flex-1 flex flex-col justify-between">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
                {product.name}
              </h3>
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Stock: <span className={`font-bold ${
                        stock <= 0 ? 'text-red-600' : stock <= 10 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{stock}</span>
                </p>
                <p className="text-lg font-bold text-emerald-600 mt-1">
                  {formatCurrency(price)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={stock <= 0}
              className="flex items-center justify-center space-x-2 w-full bg-slate-900 text-white rounded-b-xl px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
