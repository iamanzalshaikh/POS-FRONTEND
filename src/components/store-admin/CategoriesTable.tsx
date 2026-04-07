import { useState, useEffect } from "react"
import CategoryRow from "./CategoryRow"
import type { Category } from "@/types/category"
import { ChevronLeft, ChevronRight, FolderOpen } from "lucide-react"

const PAGE_SIZE = 7

interface Props {
  categories: Category[]
  loading: boolean
  searchQuery: string
}

const CategoriesTable = ({ categories, loading, searchQuery }: Props) => {
  const [page, setPage] = useState(1)

  // Filter by search query
  const filtered = searchQuery.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories

  // Reset to page 1 whenever the search query or categories list changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery, categories.length])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * PAGE_SIZE
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE)

  if (loading) {
    return (
      <div className="bg-white p-24 text-center rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-[#2563EB] rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Compiling Categories...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in hover:shadow-md transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white dark:bg-slate-900 border-t-4 border-black">
              <tr className="border-b-4 border-black">
                <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[3px] text-slate-400 w-32">
                  ID
                </th>
                <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                  Category
                </th>
                <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                  Sub Category
                </th>
                <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                  Assigned Items
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-200 border border-slate-100">
                        <FolderOpen size={28} />
                      </div>
                      <p className="text-slate-900 font-extrabold text-sm">
                        No Categories Found
                      </p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {searchQuery
                          ? "No categories match your search query"
                          : "Create a core category to begin organizing products"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((cat, idx) => (
                  <CategoryRow key={cat.id} category={cat} index={startIdx + idx + 1} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — only shows when more than PAGE_SIZE results */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Showing{" "}
            <span className="text-[#2563EB] px-2 bg-[#2563EB]/5 rounded-lg border border-[#2563EB]/10 mx-1">
              {startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="text-slate-900 font-extrabold mx-1">
              {filtered.length}
            </span>{" "}
            categories
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 hover:border-[#2563EB]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>

            <span className="min-w-[40px] h-9 flex items-center justify-center bg-[#1E1B4B] text-white text-[10px] font-black rounded-xl shadow-md shadow-[#1E1B4B]/20 border border-[#1E1B4B]/20 px-3">
              {safePage}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 hover:border-[#2563EB]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 shadow-sm"
              aria-label="Next page"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesTable
