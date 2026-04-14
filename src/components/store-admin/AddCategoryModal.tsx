import React, { useState, useEffect } from "react"
import { createPortal } from 'react-dom'
import { X, Shapes, CheckCircle2, Info } from 'lucide-react'
import { createCategory, getCategories } from "@/api/category.api"
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import type { Category } from "@/types/category"

interface Props {
  open: boolean
  onClose: () => void
  onCategoryAdded: () => void
}

function flattenCategories(nodes: unknown[]): Category[] {
  const out: Category[] = []
  const walk = (list: unknown[]) => {
    for (const n of list) {
      if (!n || typeof n !== "object") continue
      const c = n as Category & { children?: unknown[] }
      out.push(c)
      if (Array.isArray(c.children) && c.children.length) walk(c.children as unknown[])
    }
  }
  walk(nodes)
  return out
}

const AddCategoryModal = ({ open, onClose, onCategoryAdded }: Props) => {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [subcategories, setSubcategoriesText] = useState("")
  const [parents, setParents] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    setName("")
    setParentId("")
    setSubcategoriesText("")
    setError("")
    void getCategories({ tree: true })
      .then((body: { data?: unknown }) => {
        const tree = body?.data
        if (Array.isArray(tree)) {
          setParents(flattenCategories(tree))
        } else {
          void getCategories().then((flatBody: { data?: Category[] }) => {
            const rows = flatBody?.data
            setParents(Array.isArray(rows) ? rows : [])
          })
        }
      })
      .catch(() => setParents([]))
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  const handleClose = () => {
    setError("")
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Category label is required")
      return
    }

    try {
      setLoading(true)
      setError("")
      const res = await createCategory({
        name: name.trim(),
        parentId: parentId || null,
      })
      const created = (res as { data?: Category })?.data ?? (res as Category)
      const newId = created?.id as string | undefined

      if (newId && subcategories.trim()) {
        const subsArray = subcategories.split(",").map((s) => s.trim()).filter(Boolean)
        for (const subName of subsArray) {
          if (!subName) continue
          await createCategory({ name: subName, parentId: newId })
        }
      }

      onCategoryAdded()
      toast.success("Category created successfully!", "Success")
      handleClose()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      const errorMsg = msg || "Failed to create category registry."
      setError(errorMsg)
      toast.error(errorMsg, "Action Failed")
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shapes size={20} />
            </div>
            <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest leading-none">Add Category</h2>
          </div>
          <button onClick={handleClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <Info size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300 ml-1">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                placeholder="e.g. ELECTRONICS"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300 ml-1">
                Parent category (optional)
              </label>
              <select
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">— Top level —</option>
                {parents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300 ml-1">
                Sub-categories (comma separated, optional)
              </label>
              <input
                type="text"
                value={subcategories}
                onChange={(e) => setSubcategoriesText(e.target.value)}
                placeholder="Creates each as a child of the new category"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
              />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-1 opacity-60 italic">
                Saved to the server with parentId; no local-only hierarchy.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-6 shrink-0 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1e293b] dark:text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Save Category</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default AddCategoryModal
