import React from 'react';
import { Calculator, Plus } from 'lucide-react';

interface ExpensesHeaderProps {
  onAddExpense: () => void;
}

const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({ onAddExpense }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Calculator className="w-7 h-7 text-amber-500" />
          Expenses Management
        </h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage all business expenses</p>
      </div>
      <button
        onClick={onAddExpense}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-all shadow-md shadow-amber-500/20"
      >
        <Plus className="w-5 h-5" />
        Add Expense
      </button>
    </div>
  );
};

export default ExpensesHeader;
