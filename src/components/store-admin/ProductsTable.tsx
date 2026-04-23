import { useState } from "react"
import ProductRow from "./ProductRow"
import AddStockModal from "./AddStockModal"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ProductsTable({ data, onRefresh, onEdit }: any) {
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const handleAddStock = (product: any) => {
        setSelectedProduct(product);
        setIsStockModalOpen(true);
    };

    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = (data || []).slice(startIndex, startIndex + itemsPerPage);

    return (

        <div className="flex flex-col gap-4">
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white dark:bg-slate-900 border-b-2 border-black">
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 w-12">ID</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Image</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Product Details</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">SKU/Code</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Barcode</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Category</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Buying</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400">Selling</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-emerald-600">Latest</th>
                                <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 text-center">In Stock</th>
                                <th className="px-6 py-5 text-right text-[11px] font-black uppercase tracking-[3px] text-indigo-600 w-24">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {paginatedData.length > 0 ? (
                                paginatedData.map((p: any, i: number) => (
                                    <ProductRow 
                                        key={p.id} 
                                        product={{...p, onAddStock: handleAddStock}} 
                                        index={startIndex + i + 1} 
                                        onEdit={onEdit}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={11} className="px-5 py-20 text-center text-slate-400 font-medium">
                                        No products found. Start by adding one!
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-8 py-4 bg-white rounded-2xl border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Displaying {startIndex + 1} - {Math.min(startIndex + itemsPerPage, data.length)} of {data.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-slate-500"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all font-black text-blue-600"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <AddStockModal 
                open={isStockModalOpen} 
                onClose={() => setIsStockModalOpen(false)} 
                product={selectedProduct} 
                onSuccess={onRefresh}
            />

        </div>

    )

}
