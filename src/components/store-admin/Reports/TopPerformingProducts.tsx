import React from 'react';
import { Award, PackageSearch, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface TopPerformingProductsProps {
  products: any[];
}

const TopPerformingProducts: React.FC<TopPerformingProductsProps> = ({ products = [] }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mt-0 flex flex-col h-full hover:shadow-lg transition-all duration-300">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Top Performing Products</h3>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Ranked by revenue generation</p>
        </div>
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800 shadow-inner">
          <PackageSearch size={20} strokeWidth={2.5} />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rank</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Product Name</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Revenue</th>
              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Units</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {products && products.length > 0 ? (
              products.slice(0, 5).map((product, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={product.productId || product.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                        rank === 1 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {rank === 1 ? <Award size={14} /> : rank}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{product.name || 'Unknown Product'}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                        {product.sku || product.productId?.slice(-6) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-inter font-black text-slate-900 dark:text-indigo-400 text-sm tabular-nums">
                        {formatCurrency(product.revenue || 0)}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="text-xs font-black text-slate-400 dark:text-slate-500 tabular-nums">
                        {(product.quantitySold || 0).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <p className="font-inter text-sm font-medium text-slate-400">No performance data available.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default TopPerformingProducts;
