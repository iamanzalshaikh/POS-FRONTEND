import { useEffect, useState } from "react"
import AddCategoryModal from "@/components/store-admin/AddCategoryModal"
import { CheckCircle2, Plus, Search, Box, Trash2 } from "lucide-react"
import { deleteCategory, getCategories } from "@/api/category.api";
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';

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

  const filtered = categories.filter((c: any) => {
    const q = searchQuery.toLowerCase()
    const parentName = c.parent?.name?.toLowerCase() || ""
    return (
      c.name.toLowerCase().includes(q) ||
      parentName.includes(q) ||
      (c.slug && String(c.slug).toLowerCase().includes(q))
    )
  });

  const handleDelete = async (c: any) => {
    const childCount = c._count?.children ?? 0
    const productCount = c._count?.products ?? 0
    if (childCount > 0 || productCount > 0) {
      window.alert(
        `Cannot delete: ${childCount} subcategories, ${productCount} products. Remove or reassign them first.`
      )
      return
    }
    if (!window.confirm(`Delete category “${c.name}”? This cannot be undone.`)) return
    try {
      await deleteCategory(c.id)
      setSuccessMessage("Category deleted.")
      await fetchCategories()
    } catch (e: any) {
      window.alert(e.response?.data?.message || "Delete failed.")
    }
  };

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
        header: "Category Name",
        accessorKey: "name",
        meta: { align: 'left' },
        cell: ({ row }) => (
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px]">
                {row.original.name}
            </p>
        )
    },
    {
        header: "Parent",
        meta: { align: 'left' },
        cell: ({ row }) => (
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                {row.original.parent?.name || "—"}
            </p>
        )
    },
    {
        header: "Subcats",
        meta: { align: 'center' },
        cell: ({ row }) => (
            <span className="text-[10px] font-black text-slate-400 tabular-nums">
                {row.original._count?.children ?? 0}
            </span>
        )
    },
    {
        header: "Items Linked",
        meta: { align: 'center' },
        cell: ({ row }) => (
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 border border-transparent">
                <Box size={12} />
                {row.original._count?.products || 0} PRODUCTS
            </span>
        )
    },
    {
        header: "Slug",
        accessorKey: "slug",
        meta: { align: 'center' },
        cell: ({ row }) => (
            <span className="text-[10px] font-mono font-black text-slate-300 dark:text-slate-600 py-1 px-2 border border-slate-50 dark:border-slate-800 rounded-lg">
                /{row.original.slug || row.original.name.toLowerCase().replace(/\s+/g, '-')}
            </span>
        )
    },
    {
        id: "actions",
        header: "Actions",
        meta: { align: 'center' },
        cell: ({ row }) => (
            <div className="flex justify-center items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleDelete(row.original)}
                    className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    title="Delete category"
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
