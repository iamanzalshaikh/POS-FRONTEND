import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import EnhancedCalendar from '../global-components/Calendar/EnhancedCalendar';
import { createPortal } from 'react-dom';
import type { Expense } from '../../utils/expense-utils';
import { EXPENSE_CATEGORIES } from '../../utils/expense-utils';
import { getExpenseCategories, type ExpenseCategory } from '../../api/expenses.api';
import { toLocalYMD } from '@/utils/format';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  editingExpense: Expense | null;
}

export interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  date: string;
  notes: string;
  customCategoryId?: string;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    category: '',
    description: '',
    amount: '',
    date: toLocalYMD(new Date()),
    notes: '',
    customCategoryId: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategoriesLoading(true);
      getExpenseCategories()
        .then((res) => {
          // Only keep custom categories (not defaults, not "Other")
          const custom = res.data.filter(
            (c) => !c.isDefault && c.name.toLowerCase() !== 'other'
          );
          setCustomCategories(custom);
        })
        .catch(() => {})
        .finally(() => setCategoriesLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingExpense) {
      // If expense has a custom category, set the value to CUSTOM:id
      const categoryValue = editingExpense.customCategoryId
        ? `CUSTOM:${editingExpense.customCategoryId}`
        : editingExpense.category;

      setFormData({
        category: categoryValue,
        description: editingExpense.description,
        amount: editingExpense.amount.toString(),
        date: editingExpense.date,
        notes: editingExpense.notes || '',
        customCategoryId: editingExpense.customCategoryId || undefined,
      });
    } else {
      setFormData({
        category: '',
        description: '',
        amount: '',
        date: toLocalYMD(new Date()),
        notes: '',
        customCategoryId: undefined,
      });
    }
    setError(null);
  }, [editingExpense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Parse category value - handle custom categories
    let category = formData.category;
    let customCategoryId: string | undefined = undefined;

    if (category.startsWith('CUSTOM:')) {
      customCategoryId = category.replace('CUSTOM:', '');
      category = 'OTHER'; // Backend requires a valid enum value when customCategoryId is provided
    }

    try {
      await onSubmit({
        category,
        description: formData.description,
        amount: formData.amount,
        date: formData.date,
        notes: formData.notes,
        customCategoryId,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                {editingExpense ? 'Modify Expense Registry' : 'Create New Expense'}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                Authorized Expenditure Entry
              </p>
            </div>
          </div>
          <button onClick={onClose} type="button" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-2xl text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                Transaction Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={categoriesLoading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all disabled:opacity-50"
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                  {customCategories.map((cat) => (
                    <option key={cat.id} value={`CUSTOM:${cat.id}`}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                Brief Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="e.g., Office supplies purchase"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Amount & Date Row */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                  Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[14px] font-black text-blue-600 dark:text-blue-400 tabular-nums focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                  Transaction Date <span className="text-rose-500">*</span>
                </label>
                <EnhancedCalendar
                  value={formData.date}
                  onChange={(val) => setFormData({ ...formData, date: val })}
                  required
                  className="w-full"
                  inputClassName="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all cursor-pointer hover:border-blue-500/50"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#64748b] ml-1">
                Internal Registry Notes <span className="text-slate-400 opacity-50 uppercase lowercase">(optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional audit details..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[12px] font-bold text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all active:scale-95"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:bg-slate-400 disabled:border-slate-500 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Transmitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>{editingExpense ? 'Update Registry' : 'Authorize Entry'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
  
};

export default ExpenseModal;
