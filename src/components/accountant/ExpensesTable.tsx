import React from 'react';
import { Edit2, Trash2, Calculator } from 'lucide-react';
import type { Expense } from '../../utils/expense-utils';
import { formatCurrency, formatDate, getCategoryLabel } from '../../utils/expense-utils';

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  onEdit,
  onDelete,
  deleteConfirmId,
  setDeleteConfirmId,
}) => {
  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="py-12 text-center text-slate-400">
          <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-bold">No expenses found</p>
          <p className="text-xs mt-1">Add your first expense to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                ID
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Category
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Description
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Amount
              </th>
              <th className="text-left py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Date
              </th>
              <th className="text-right py-4 px-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="text-xs font-mono font-semibold text-slate-600">
                    {expense.displayId || `#${expense.id.slice(-6).toUpperCase()}`}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700">
                    {getCategoryLabel(expense.category)}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{expense.description}</div>
                    {expense.notes && (
                      <div className="text-xs text-slate-500 mt-0.5">{expense.notes}</div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-base font-black text-slate-900">{formatCurrency(expense.amount)}</span>
                    {expense.category === 'SUPPLIER_PURCHASE' && (
                      <div className="flex flex-col mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight">
                          Payable: {formatCurrency(expense.supplierPayable || 0)}
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight leading-tight">
                          Paid: {formatCurrency(expense.supplierPaid || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="text-sm font-medium text-slate-600">{formatDate(expense.date)}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {deleteConfirmId === expense.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDelete(expense.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(expense.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesTable;
