import { useState } from "react"
import { useQuery } from '@tanstack/react-query';
import AddCategoryModal from "@/components/store-admin/AddCategoryModal"
import { Plus, Search, Trash2, Edit2 } from "lucide-react"
import { deleteCategory, getCategories } from "@/api/category.api";
import { toast } from '@/lib/toast';
import { DataTable } from '@/components/global-components/data-table-2';
import type { ColumnDef } from '@tanstack/react-table';
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";

const ProductCategoriesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1);
  const limit = 10;

  // Queries
  const { 
    data: catRes, 
    isLoading: loading, 
    refetch 
  } = useQuery({
    queryKey: ['categories', page, searchQuery],
    queryFn: () => getCategories({ page, limit, search: searchQuery }),
    staleTime: 1000 * 60 * 5,
  });

  const rawPayload = catRes?.data;
  let categories: any[] = [];
  let total = 0;

  if (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
    categories = rawPayload.data || [];
    total = rawPayload.total || 0;
  } else {
    categories = Array.isArray(rawPayload) ? rawPayload : [];
    total = categories.length;
  }

  const handleDelete = async (c: any) => {
    const childCount = c._count?.children ?? 0
    const productCount = c._count?.products ?? 0
    if (childCount > 0 || productCount > 0) {
      toast.warning(
        `Cannot delete: ${childCount} subcategories, ${productCount} products. Remove or reassign them first.`,
        "Dependency Found"
      )
      return
    }
    if (!window.confirm(`Delete category “${c.name}”? This cannot be undone.`)) return
    try {
      await deleteCategory(c.id)
      toast.success("Category deleted.", "Success")
      refetch()
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Delete failed.", "Action Failed")
    }
  };
  
  const handleEdit = (c: any) => {
    setSelectedCategory(c)
    setIsModalOpen(true)
  }

  const columns: ColumnDef<any>[] = [
    {
        header: "ID",
        cell: ({ row }) => (
            <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest text-center">
                {String(((page - 1) * limit) + row.index + 1).padStart(2, '0')}
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
        header: "Items",
        meta: { align: 'center' },
        cell: ({ row }) => (
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 border border-transparent">
                {row.original._count?.products || 0}
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
                    onClick={() => handleEdit(row.original)}
                    className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                    title="Edit category"
                >
                    <Edit2 size={16} />
                </button>
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

  const handleCategoryAdded = () => {
    refetch()
    toast.success("Category created successfully!", "Success")
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">

      {/* Inline Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Product Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-1 uppercase tracking-widest">Manage categorization and product hierarchy</p>
        </div>
        <button
          onClick={() => {
            setSelectedCategory(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-[#262255] text-white rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-900/20"
        >
          <Plus size={18} />
          Add New Category
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        {loading && categories.length === 0 ? (
            <TableSkeleton columns={6} rows={limit} />
        ) : (
            <DataTable 
                columns={columns} 
                data={categories}
                isLoading={loading}
                onRefresh={() => refetch()}
                placeholder="Search categories..."
                hidePagination={false}
                manualPagination={true}
                pageIndex={page}
                pageSize={limit}
                totalItems={total}
                pageCount={Math.ceil(total / limit)}
                onPageChange={(newPageIndex) => setPage(newPageIndex)}
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
        )}
      </div>

      <AddCategoryModal
        open={isModalOpen}
        category={selectedCategory}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCategory(null)
        }}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  )
}

export default ProductCategoriesPage
