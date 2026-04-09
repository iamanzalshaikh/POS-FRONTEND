import { Plus } from 'lucide-react';

interface CategoriesHeaderProps {
    onAddCategory: () => void;
}

export default function CategoriesHeader({ onAddCategory }: CategoriesHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-in px-2">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Product Categories</h1>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                    Organize your inventory with structured product categorization.
                </p>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onAddCategory}
                    className="flex items-center gap-3 px-8 py-3.5 bg-indigo-900 border border-indigo-900/20 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-600 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" strokeWidth={3} />
                    Add Category
                </button>
            </div>
        </div>
    );
}
