import { useState } from "react"
import ProductRow from "./ProductRow"
import AddStockModal from "./AddStockModal"

export default function ProductsTable({ data, onRefresh }: any) {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    const handleAddStock = (product: any) => {
        setSelectedProduct(product);
        setIsStockModalOpen(true);
    };

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-12">#</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Product Name</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">SKU/Code</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Barcode</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Buying</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Selling</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">In Stock</th>
                            <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">

                        {data.length > 0 ? (
                            data.map((p: any, i: number) => (
                                <ProductRow 
                                    key={p.id} 
                                    product={{...p, onAddStock: handleAddStock}} 
                                    index={i + 1} 
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-5 py-20 text-center text-slate-400 font-medium">
                                    No products found. Start by adding one!
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>

            <AddStockModal 
                open={isStockModalOpen} 
                onClose={() => setIsStockModalOpen(false)} 
                product={selectedProduct} 
                onSuccess={onRefresh}
            />

        </div>

    )

}
