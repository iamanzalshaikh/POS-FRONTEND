import { useEffect, useState } from "react"
import CategoriesTable from "@/components/store-admin/CategoriesTable"
import AddCategoryModal from "@/components/store-admin/AddCategoryModal"
import { CheckCircle2, Plus, Search } from "lucide-react"
import { getCategories } from "@/api/category.api";

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

      {/* Inline Search */}
      <div className="relative group max-w-md">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 rounded-lg group-focus-within:bg-indigo-50 transition-colors">
          <Search size={16} className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Filter categories by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 focus:border-indigo-500/50 rounded-3xl text-sm font-medium transition-all shadow-sm outline-none placeholder:text-slate-400 placeholder:italic focus:ring-4 focus:ring-indigo-500/5"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
        <CategoriesTable
          categories={categories}
          loading={loading}
          searchQuery={searchQuery}
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
