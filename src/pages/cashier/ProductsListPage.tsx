import React, { useEffect, useState } from 'react';
import { Package, Search, RefreshCcw, AlertCircle } from 'lucide-react';
import { fetchProducts } from '../../api/products.api';
import { formatCurrency } from '../../utils/expense-utils';

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
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts();
      console.log('📦 ProductsListPage - Raw response:', res);

      // fetchProducts returns { success, data: [...], message }
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

      console.log('📦 ProductsListPage - Parsed', productList.length, 'products');
      setProducts(productList);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load products';
      setError(errorMessage);
      setProducts([]);
      console.error('❌ Products API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package size={20} className="text-emerald-500" />
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">
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
          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-4 mb-4 text-xs">
        <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200 text-emerald-800">
          <Package size={14} />
          <span className="font-semibold">
            Total: {products.length} products
          </span>
        </div>
        {filteredProducts.length !== products.length && (
          <div className="inline-flex items-center space-x-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-200 text-blue-800">
            <Search size={14} />
            <span className="font-semibold">
              Showing: {filteredProducts.length} results
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-slate-500">Loading products...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle size={40} className="text-rose-500" />
            <div>
              <p className="text-sm font-bold text-slate-900">Failed to load products</p>
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
      ) : filteredProducts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Package size={40} className="text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                {searchQuery ? 'No products found' : 'No products available'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery ? 'Try adjusting your search terms' : 'Products will appear here once added to your store'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-900">{product.name}</span>
                        {product.description && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {product.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-600 font-mono">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 font-mono">{product.barcode}</span>
                    </td>
                    <td className="px-4 py-3">
                      {product.category ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-slate-900">
                        {formatPrice(product.sellingPrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${
                        getStockQuantity(product) <= 0
                          ? 'text-rose-600'
                          : getStockQuantity(product) <= 10
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {getStockQuantity(product)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        product.isActive
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsListPage;
