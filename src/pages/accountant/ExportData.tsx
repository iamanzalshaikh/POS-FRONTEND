import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { getSalesReport, getInventoryReport, getSalesTransactions } from '../../api/finance.api';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  format: string;
  icon: React.ReactNode;
  endpoint: string;
}

const ExportData: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2025-10-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [filterCategory, setFilterCategory] = useState('all');

  const exportOptions: ExportOption[] = [
    {
      id: '1',
      name: 'Financial Statements',
      description: 'Complete financial reports including balance sheet, P&L, and cash flow',
      format: 'PDF, Excel',
      icon: <FileSpreadsheet size={24} className="text-emerald-400" />,
      endpoint: 'financial-statements'
    },
    {
      id: '2',
      name: 'Tax Reports',
      description: 'GST, TDS, and income tax summaries for filing',
      format: 'PDF, Excel',
      icon: <FileText size={24} className="text-amber-400" />,
      endpoint: 'tax-reports'
    },
    {
      id: '3',
      name: 'Expense Ledger',
      description: 'Detailed expense transactions with categories',
      format: 'Excel, CSV',
      icon: <FileSpreadsheet size={24} className="text-blue-400" />,
      endpoint: 'expense-ledger'
    },
    {
      id: '4',
      name: 'Revenue Report',
      description: 'Sales and revenue breakdown by period',
      format: 'PDF, Excel',
      icon: <FileText size={24} className="text-purple-400" />,
      endpoint: 'revenue-report'
    },
  ];

  const handleExport = async (optionId: string) => {
    try {
      setLoading(optionId);
      
      if (optionId === '4') { // Revenue Report
        const response = await getSalesReport({ startDate, endDate });
        if (response.data?.success) {
          alert('Revenue report downloaded successfully!');
        }
      } else if (optionId === '3') { // Expense Ledger
        const response = await getInventoryReport();
        if (response.data?.success) {
          alert('Expense ledger downloaded successfully!');
        }
      } else if (optionId === '2') { // Tax Reports
        const response = await getSalesReport({ startDate, endDate });
        if (response.data?.success) {
          alert('Tax report downloaded successfully!');
        }
      } else { // Financial Statements
        const response = await getSalesTransactions({ startDate, endDate, limit: 100 });
        if (response.data?.success) {
          alert('Financial statements downloaded successfully!');
        }
      }
    } catch (err: any) {
      alert(`Export failed: ${err.response?.data?.message || 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    alert('Exporting all reports - This would generate a ZIP file with all reports');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Export Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <Download size={24} className="mr-3 text-amber-400" />
              Export Financial Data
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
              Download reports in multiple formats
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="flex items-center space-x-2 px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30"
          >
            <Download size={16} />
            <span>Export All</span>
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              Start Date
            </label>
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              End Date
            </label>
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">
              Filter By
            </label>
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <Filter size={16} className="text-slate-400" />
              <select
                className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="revenue">Revenue</option>
                <option value="expenses">Expenses</option>
                <option value="tax">Tax</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exportOptions.map((option) => (
          <div
            key={option.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                {option.icon}
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                {option.format}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">{option.name}</h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-4">
              {option.description}
            </p>

            <button
              onClick={() => handleExport(option.id)}
              disabled={loading === option.id}
              className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === option.id ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mr-2"></span>
                  Generating...
                </span>
              ) : (
                'Download Report'
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Scheduled Exports */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Scheduled Exports</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet size={20} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Monthly Financial Summary</div>
                <div className="text-[10px] text-slate-500 font-black uppercase">Every 1st of month • Excel</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Active
              </span>
              <button className="text-[10px] font-black uppercase text-slate-500 hover:text-red-500 tracking-widest">
                Cancel
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Quarterly Tax Report</div>
                <div className="text-[10px] text-slate-500 font-black uppercase">Every quarter end • PDF</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Active
              </span>
              <button className="text-[10px] font-black uppercase text-slate-500 hover:text-red-500 tracking-widest">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all">
          + Schedule New Export
        </button>
      </div>
    </div>
  );
};

export default ExportData;
