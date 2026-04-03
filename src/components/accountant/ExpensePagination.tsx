import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpensePaginationProps {
  page: number;
  setPage: (page: number) => void;
  total: number;
  limit: number;
}

const ExpensePagination: React.FC<ExpensePaginationProps> = ({
  page,
  setPage,
  total,
  limit,
}) => {
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between">
      <div className="text-xs font-bold text-slate-500">
        Showing <span className="text-slate-900">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
        <span className="text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
        <span className="text-slate-900">{total}</span> expenses
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                pageNum === page
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExpensePagination;
