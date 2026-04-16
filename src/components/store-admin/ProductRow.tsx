import ProductStockBadge from "./ProductStockBadge"
import { Trash, Plus, Box } from "lucide-react"
import { formatCurrency } from "@/utils/format"

export default function ProductRow({ product, index }: any) {

    return (
        <tr className="border-b-2 border-black last:border-0 hover:bg-slate-50 transition-all duration-300 group cursor-pointer">
            <td className="px-6 py-6 text-slate-400 font-mono text-[10px]">{index.toString().padStart(2, '0')}</td>

            <td className="px-6 py-6">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-indigo-600/20 transition-all shrink-0">
                    {product.image ? (
                        <img 
                            src={`http://localhost:3005${product.image}`} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                            <Box size={20} strokeWidth={1.5} />
                        </div>
                    )}
                </div>
            </td>

            <td className="px-6 py-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                            {product.name}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            product.isActive 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[2px] mt-0.5 truncate leading-none">ID: {product.id.slice(0, 8)}</p>
                </div>
            </td>

            <td className="px-6 py-6 text-slate-600 text-[11px] font-black uppercase tracking-widest tabular-nums">
                {product.sku || 'N/A'}
            </td>

            <td className="px-6 py-6 text-slate-500 font-mono text-[11px]">
                {product.barcode || '---'}
            </td>

            <td className="px-6 py-6">
                <span className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[2px]">
                    {product.category?.name || 'General'}
                </span>
            </td>

            <td className="px-6 py-6 text-slate-900 text-[11px] font-black uppercase tracking-widest tabular-nums">
                {formatCurrency(Number(product.purchasePrice))}
            </td>

            <td className="px-6 py-6 text-indigo-600 text-[11px] font-black uppercase tracking-widest tabular-nums">
                {formatCurrency(Number(product.sellingPrice))}
            </td>
            
            <td className="px-6 py-6 text-emerald-600 text-[11px] font-black uppercase tracking-widest tabular-nums font-black animate-pulse">
                {formatCurrency(Number(product.latestSellingPrice || product.sellingPrice))}
            </td>

            <td className="px-6 py-6 text-center">
                <ProductStockBadge stock={product.stock ?? 0} reorderLevel={product.reorderLevel} />
            </td>

            <td className="px-6 py-6">
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); product.onAddStock?.(product); }}
                        className="p-2 text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-xl transition-all active:scale-90 flex items-center gap-1.5 shadow-sm"
                        title="Add Stock"
                    >
                        <Plus size={16} />
                        <span className="text-[10px] font-black uppercase text-indigo-600">Stock</span>
                    </button>
                    <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90">
                        <Trash size={16} />
                    </button>
                </div>
            </td>
        </tr>
    )
}
