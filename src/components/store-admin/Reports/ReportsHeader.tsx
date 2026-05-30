import React from 'react';
import { Calendar } from 'lucide-react';

interface ReportsHeaderProps {
  activeTab: 'sales' | 'inventory';
  onTabChange: (tab: 'sales' | 'inventory') => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({ activeTab, onTabChange, dateRange, onDateRangeChange }) => {
  const isSpecificMonth = dateRange.includes('-') && dateRange.length === 7; // e.g. 2024-05

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[20px] border border-slate-200 dark:border-slate-700/50">
        <button 
          onClick={() => onTabChange('sales')}
          className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-[14px] transition-all duration-300 ${activeTab === 'sales' ? 'bg-[#1E1B4B] text-white shadow-xl shadow-indigo-950/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Sales Analytics
        </button>
        <button 
          onClick={() => onTabChange('inventory')}
          className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-[14px] transition-all duration-300 ${activeTab === 'inventory' ? 'bg-[#1E1B4B] text-white shadow-xl shadow-indigo-950/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Inventory Insights
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative group">
          <select 
            value={isSpecificMonth ? 'Specific Month' : dateRange} 
            onChange={(e) => {
              if (e.target.value !== 'Specific Month') {
                onDateRangeChange(e.target.value);
              }
            }}
            className="appearance-none bg-slate-50 dark:bg-slate-800 border-none rounded-[14px] px-6 py-2.5 pr-10 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>Month</option>
            <option disabled={!isSpecificMonth}>Specific Month</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-[14px] border border-indigo-100 dark:border-indigo-900/30">
          <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
          <input 
            type="month"
            value={isSpecificMonth ? dateRange : ''}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300 focus:ring-0 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsHeader;

