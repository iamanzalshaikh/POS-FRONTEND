import InventoryRow from "./InventoryRow"
import type { InventoryMovement } from "@/pages/store-admin/inventory/InventoryManagementPage"

interface Props {
  movements: InventoryMovement[]
  loading: boolean
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

const InventoryTable = ({ movements, loading, currentPage, totalCount, itemsPerPage, onPageChange }: Props) => {
  if (loading) {
    return (
      <div className="bg-white rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 shadow-sm transition-all duration-300">
        <div className="w-12 h-12 border-[3px] border-slate-100 border-t-[#2563EB] rounded-full animate-spin"></div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[2px] animate-pulse mt-6">Indexing Logs...</p>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="bg-white rounded-[32px] p-24 flex flex-col items-center justify-center border border-slate-100 shadow-sm text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">No logs recorded</h3>
        <p className="text-slate-400 text-xs font-medium max-w-xs uppercase tracking-widest leading-loose">We couldn't find any inventory movements matching your active criteria.</p>
      </div>
    )
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-lg transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-white dark:bg-slate-900 border-t-4 border-black">
            <tr className="border-b-4 border-black">
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 w-12">ID</th>
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Product Details</th>
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Movement</th>
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap shrink-0">Status</th>
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Operator</th>
              <th className="px-6 py-5 text-left text-[11px] font-black uppercase tracking-[3px] text-slate-400 whitespace-nowrap">Timestamp</th>
              <th className="px-6 py-5 text-right text-[11px] font-black uppercase tracking-[3px] text-indigo-600 whitespace-nowrap w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {movements.map((movement, idx) => (
              <InventoryRow key={movement.id} movement={movement} index={startEntry + idx} />
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Showing <span className="text-indigo-600 font-black px-2 bg-indigo-50 border border-indigo-100 rounded-lg mx-1">{startEntry}–{endEntry}</span> of <span className="text-slate-900 font-black mx-1">{totalCount}</span> entries
        </p>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            &lt;
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${
                currentPage === i + 1 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 border border-slate-900" 
                  : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  )
}

export default InventoryTable
