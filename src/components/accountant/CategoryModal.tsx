import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Shapes } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategory,
} from '../../api/expenses.api';
import Toast, { type ToastType } from '../ui/Toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onCategoryCreated }) => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getExpenseCategories();
      if (response.success) {
        // Only show custom categories (not defaults)
        const customOnly = response.data.filter((c) => !c.isDefault);
        setCategories(customOnly);
      }
    } catch (error: any) {
      showToast('Failed to fetch categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    const trimmed = newCategoryName.trim();

    if (trimmed.toLowerCase() === 'other') {
      showToast('Cannot create a category named "Other"', 'error');
      return;
    }

    // Check for duplicates client-side before sending request
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      showToast('Category already exists', 'error');
      return;
    }

    try {
      const response = await createExpenseCategory(trimmed);
      if (response.success) {
        showToast('Category created successfully', 'success');
        setNewCategoryName('');
        await fetchCategories();
        onCategoryCreated();
      }
    } catch (error: any) {
      console.error('[CategoryModal] Error creating category:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to create category';
      showToast(message, 'error');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    if (editingName.trim().toLowerCase() === 'other') {
      showToast('Cannot name a category "Other"', 'error');
      return;
    }

    try {
      const response = await updateExpenseCategory(id, editingName.trim());
      if (response.success) {
        showToast('Category updated successfully', 'success');
        setEditingId(null);
        setEditingName('');
        await fetchCategories();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update category';
      showToast(message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This will fail if expenses are using it.')) {
      return;
    }

    try {
      const response = await deleteExpenseCategory(id);
      if (response.success) {
        showToast('Category deleted successfully', 'success');
        await fetchCategories();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete category';
      showToast(message, 'error');
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <Shapes size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                Category Directory
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                Resource Taxonomy Management
              </p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-8 mt-4 z-[100]">
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </div>
        )}

        {/* Add New Category */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1 mb-2 block">Create New Entry</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter category name..."
              className="flex-1 px-5 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/5"
            />
            <button
              onClick={handleCreate}
              disabled={!newCategoryName.trim()}
              className="px-8 py-3.5 bg-[#2563eb] hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 border-b-4 border-blue-800"
            >
              Initialize
            </button>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">Synchronizing Ledger...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-4 opacity-40">
              <Shapes className="text-slate-300 dark:text-slate-700" size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No organizational entries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] group hover:border-blue-100 dark:hover:border-blue-900/50 transition-all"
                >
                  {editingId === category.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900 rounded-xl font-bold text-sm text-slate-900 dark:text-white outline-none"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(category.id)}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-b-4 border-blue-800"
                        >
                          Commit
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                          className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                          Abort
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                        <Shapes size={16} />
                      </div>
                      <span className="flex-1 text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">{category.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
          >
            Dismiss Directory
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
  
};

export default CategoryModal;
