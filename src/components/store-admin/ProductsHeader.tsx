import { Plus, Download } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ProductsHeaderProps {
  openOpeningModal?: () => void;
  openMasterModal?: () => void;
}
export default function ProductsHeader({ openOpeningModal, openMasterModal }: ProductsHeaderProps) {
    const navigate = useNavigate();

    return (

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">

            <div>

                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                    Products
                </h1>

                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">
                    Manage your store inventory and pricing.
                </p>

            </div>

            <div className="flex gap-3 w-full sm:w-auto">

                <button className="flex-1 sm:flex-none border border-slate-200 bg-white px-5 py-3 rounded-2xl hover:bg-slate-50 hover:border-indigo-600/30 hover:text-indigo-600 text-slate-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm group">
                    <Download size={14} className="text-slate-400 group-hover:text-indigo-600" />
                    Export CSV
                </button>

                <button
                    onClick={() => openOpeningModal ? openOpeningModal() : navigate('/store-admin/inventory/products/add')}
                    className="flex-1 sm:flex-none bg-indigo-900 text-white px-6 py-4 rounded-2xl hover:bg-indigo-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 border border-indigo-900/20"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Add Opening Product
                </button>

                <button
                    onClick={() => openMasterModal ? openMasterModal() : navigate('/store-admin/inventory/products/add')}
                    className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl hover:bg-blue-700 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 border border-blue-600/20"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    Add Product
                </button>

            </div>

        </div>

    )

}
