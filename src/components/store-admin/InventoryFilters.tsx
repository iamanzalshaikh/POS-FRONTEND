import { Download, Search } from "lucide-react"

interface InventoryFiltersProps {
    searchQuery: string;
    onSearchChange: (val: string) => void;
    typeFilter: string;
    onTypeChange: (val: string) => void;
    timeFilter: string;
    onTimeChange: (val: string) => void;
}

const InventoryFilters = ({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeChange,
    timeFilter,
    onTimeChange
}: InventoryFiltersProps) => {
    return (
        <div className="bg-white rounded-[24px] border border-slate-100 p-2 flex gap-3 flex-wrap items-center shadow-sm hover:shadow-md transition-all duration-300">
            {/* Search Input */}
            <div className="flex-1 min-w-[250px] relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                    placeholder="Search by product, SKU or Reference..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-2.5 pl-12 pr-4 outline-none focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-medium text-slate-700 placeholder:text-slate-300 text-[11px]"
                />
            </div>

            <div className="flex gap-3 flex-wrap">
                <div className="relative group">
                    <select 
                        value={timeFilter}
                        onChange={(e) => onTimeChange(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 outline-none focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold uppercase tracking-widest text-[10px] text-slate-500 cursor-pointer min-w-[150px]"
                    >
                        <option value="All Time">All Time</option>
                        <option value="Today">Today</option>
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="Last 30 Days">Last 30 Days</option>
                        <option value="This Month">This Month</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                <div className="relative group">
                    <select 
                        value={typeFilter}
                        onChange={(e) => onTypeChange(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 outline-none focus:bg-white focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold uppercase tracking-widest text-[10px] text-slate-500 cursor-pointer min-w-[150px]"
                    >
                        <option value="All Movements">All Movements</option>
                        <option value="Sale">Sale</option>
                        <option value="Restock">Restock</option>
                        <option value="Adjustment">Adjustment</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default InventoryFilters
