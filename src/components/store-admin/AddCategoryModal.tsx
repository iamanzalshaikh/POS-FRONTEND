import React, { useState, useEffect } from "react"
import { createPortal } from 'react-dom'
import { X, Shapes, Plus, Layers } from 'lucide-react'
import { createCategory, setSubcategories } from "@/api/category.api"
import { cn } from "@/lib/utils"

interface Props {
  open: boolean
  onClose: () => void
  onCategoryAdded: () => void
}

const AddCategoryModal = ({ open, onClose, onCategoryAdded }: Props) => {
  const [name, setName] = useState("")
  const [subcategories, setSubcategoriesText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setName("");
      setSubcategoriesText("");
      setError("");
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  if (!open) return null

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Category label is required")
      return
    }

    try {
      setLoading(true)
      setError("")
      const res = await createCategory({ name })
      const newCategory = res.data || res;
      
      if (newCategory?.id && subcategories.trim()) {
        const subsArray = subcategories.split(',').map(s => s.trim()).filter(s => s !== "");
        setSubcategories(newCategory.id, subsArray);
      }

      onCategoryAdded()
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create category registry.")
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden uppercase">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={handleClose} />
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in border border-white/5 dark:border-white/10">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Taxonomy Hub</h2>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Classification Registry</p>
          </div>
          <button onClick={handleClose} type="button" className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 transition-all active:scale-95">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-widest leading-relaxed">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Universal Label</label>
              <div className="relative group">
                <Shapes className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                  }}
                  placeholder="e.g. ELECTRONICS"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sub-Collection Registry</label>
              <div className="relative group">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={subcategories}
                  onChange={(e) => setSubcategoriesText(e.target.value)}
                  placeholder="item 1, item 2, item 3"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black text-slate-900 dark:text-white"
                />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1 opacity-60">
                Separate by comma delimiters
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 shrink-0">
            <button type="button" onClick={handleClose} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-2 py-4 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 border border-indigo-500 flex items-center justify-center gap-2">
              {loading ? (
                <span className="animate-pulse">Initializing...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Taxonomy
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AddCategoryModal



