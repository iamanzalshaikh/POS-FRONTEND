import { useEffect, useState } from "react"
import AddCategoryModal from "@/components/store-admin/AddCategoryModal"
import { CheckCircle2, Plus, Search, Layers, Box, Hash, Trash2 } from "lucide-react"
import { getCategories } from "@/api/category.api";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

const ProductCategoriesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [categoriesRes, setCategoriesRes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategoriesRes(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  const categories = (categoriesRes as any)?.data || (Array.isArray(categoriesRes) ? categoriesRes : []);

  const filtered = categories.filter((c: any) => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<any>[] = [
    {
        header: "ID",
        cell: ({ row }) => (
            <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                {String(row.index + 1).padStart(2, '0')}
            </div>
        )
    },
    {
        header: "Hierarchy",
        accessorKey: "name",
        cell: ({ row }) => (
            <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm transition-all group-hover:scale-110">
                    <Layers size={20} />
                </div>
                <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.name}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 max-w-[240px] truncate leading-none">
                        {row.original.description || "No classification details provided."}
                    </p>
                </div>
            </div>
        )
    },
    {
        header: "Items Linked",
        cell: ({ row }) => (
            <div className="flex justify-center">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 border border-transparent">
                    <Box size={12} />
                    {row.original._count?.products || 0} PRODUCTS
                </span>
            </div>
        )
    },
    {
        header: "Slug",
        accessorKey: "slug",
        cell: ({ row }) => (
            <div className="text-center">
                <span className="text-[10px] font-mono font-black text-slate-300 dark:text-slate-600 py-1 px-2 border border-slate-50 dark:border-slate-800 rounded-lg">
                    /{row.original.slug || row.original.name.toLowerCase().replace(/\s+/g, '-')}
                </span>
            </div>
        )
    },
    {
        id: "actions",
        header: "Actions",
        cell: () => (
            <div className="flex justify-center items-center gap-2">
                <button 
                    disabled
                    className="p-2.5 text-slate-200 dark:text-slate-800 cursor-not-allowed opacity-50"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        )
    }
  ];

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successMessage) return
    const t = setTimeout(() => setSuccessMessage(""), 3000)
    return () => clearTimeout(t)
  }, [successMessage])

  const handleCategoryAdded = () => {
    fetchCategories()
    setSuccessMessage("Category created successfully!")
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Success Toast */}
      {successMessage && (
        <div className="flex items-center gap-3 bg-white dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-5 py-4 rounded-2xl shadow-lg shadow-emerald-50 dark:shadow-none animate-in slide-in-from-top duration-300">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{successMessage}</span>
        </div>
      )}

      {/* Inline Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Product Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">Manage categorization and product hierarchy</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#262255] text-white rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-900/20"
        >
          <Plus size={18} />
          Add New Category
        </button>
      </div>

      {/* Management Ledger Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable 
            columns={columns} 
            data={filtered}
            isLoading={loading}
            onRefresh={fetchCategories}
            placeholder="Search categories..."
            headerActions={
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-[280px]"
                        />
                    </div>
                </div>
            }
        />
      </div>

      <AddCategoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  )
}

export default ProductCategoriesPage
