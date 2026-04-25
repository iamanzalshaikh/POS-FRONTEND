import React, { useState, useEffect } from "react"
import { createPortal } from 'react-dom'
import { X, Shapes, CheckCircle2, Info,Plus  } from 'lucide-react'
import { createCategory, getCategories, updateCategory } from "@/api/category.api"
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import type { Category } from "@/types/category"


interface Props {
  open: boolean
  onClose: () => void
  onCategoryAdded: () => void
  category?: Category | null
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

const AddCategoryModal = ({ open, onClose, onCategoryAdded, category }: Props) => {
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string>("")
  const [subcategories, setSubcategories] = useState<{ id?: string, name: string }[]>([])
  const [parents, setParents] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    if (category) {
      setName(category.name)
      
      // Fetch all categories to filter for children
      setLoading(true)
      getCategories()
        .then(res => {
            const allCats = Array.isArray(res) ? res : (res.data || []);
            const children = allCats.filter((c: any) => c.parentId === category.id);
            setSubcategories(children.map((c: any) => ({ id: c.id, name: c.name })));
        })
        .catch(err => {
            console.error("Failed to load subcategories:", err);
            setSubcategories([]);
        })
        .finally(() => setLoading(false));
    } else {
      setName("")
      setSubcategories([])
    }
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
    setSubcategories([])
    onClose()
  }

  const addSubcategoryField = () => {
    setSubcategories([...subcategories, { name: "" }])
  }

  const removeSubcategoryField = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index))
  }

  const updateSubcategoryValue = (index: number, value: string) => {
    const next = [...subcategories]
    next[index].name = value
    setSubcategories(next)
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

      if (category) {
        await updateCategory(category.id, {
          name: name.trim(),
        })
        
        // Handle updating existing and adding new subcategories
        if (subcategories.length > 0) {
            for (const sub of subcategories) {
              if (!sub.name.trim()) continue
              if (sub.id) {
                // Update existing
                await updateCategory(sub.id, { name: sub.name.trim() })
              } else {
                // Create new
                await createCategory({ name: sub.name.trim(), parentId: category.id })
              }
            }
        }
      } else {
        const res = await createCategory({
          name: name.trim(),
        })
        const created = (res as { data?: Category })?.data ?? (res as Category)
        const newId = created?.id as string | undefined
  
        if (newId && subcategories.length > 0) {
          for (const sub of subcategories) {
            if (!sub.name.trim()) continue
            await createCategory({ name: sub.name.trim(), parentId: newId })
          }
        }
      }

      onCategoryAdded()
      toast.success(`Category ${category ? 'updated' : 'created'} successfully!`, "Success")
      handleClose()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      const errorMsg = msg || `Failed to ${category ? 'update' : 'create'} category registry.`
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
            <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest leading-none">
              {category ? 'Edit Category' : 'Add Category'}
            </h2>
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

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-slate-300">
                  Sub-categories (Optional)
                </label>
                <button
                  type="button"
                  onClick={addSubcategoryField}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  <Plus size={14} strokeWidth={3} />
                  Add Field
                </button>
              </div>
              
              {subcategories.map((sub, idx) => (
                <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => updateSubcategoryValue(idx, e.target.value)}
                      placeholder={`Subcategory ${idx + 1}`}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none transition-all font-semibold text-sm text-slate-900 dark:text-white"
                    />
                    {sub.id && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                        Existing
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubcategoryField(idx)}
                    className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              {subcategories.length === 0 && (
                <button
                  type="button"
                  onClick={addSubcategoryField}
                  className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-all">
                    New Sub-category Registry
                  </span>
                </button>
              )}

              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1 opacity-60 leading-relaxed italic">
                {category 
                  ? "Adding new items here will create them as children of this category." 
                  : "These will be created as sub-items under the new category above."}
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
                  <span>{category ? 'Update Category' : 'Save Category'}</span>
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
