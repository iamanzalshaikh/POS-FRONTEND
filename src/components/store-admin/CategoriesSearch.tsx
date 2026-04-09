import { Search } from 'lucide-react';

interface CategoriesSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export default function CategoriesSearch({ value, onChange }: CategoriesSearchProps) {
    return (
        <div className="relative max-w-md animate-fade-in px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search categories by name..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/30 transition-all shadow-sm"
            />
        </div>
    );
}
