import React from 'react';

interface ReportsHeaderProps {
  activeTab: 'sales' | 'inventory';
  onTabChange: (tab: 'sales' | 'inventory') => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

const ReportsHeader: React.FC<ReportsHeaderProps> = ({ activeTab, onTabChange, dateRange, onDateRangeChange }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
      <div className="flex space-x-4">
        <button 
          onClick={() => onTabChange('sales')}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'sales' ? 'bg-[#1E1B4B] text-white shadow-lg shadow-indigo-950/20' : 'bg-white text-slate-600 border'}`}
        >
          Sales Report
        </button>
        <button 
          onClick={() => onTabChange('inventory')}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-[#1E1B4B] text-white shadow-lg shadow-indigo-950/20' : 'bg-white text-slate-600 border'}`}
        >
          Inventory Report
        </button>
      </div>
      <div>
        <select 
          value={dateRange} 
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="border rounded-lg px-4 py-2 font-medium"
        >
          <option>Today</option>
          <option>This Week</option>
          <option>Month</option>
        </select>
      </div>
    </div>
  );
};

export default ReportsHeader;
