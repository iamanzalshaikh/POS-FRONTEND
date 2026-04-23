import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Filter } from 'lucide-react';
import { getSalesReport, getProfitAndLoss } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import { exportToExcel } from '../../utils/excel-export';
import { getCategoryLabel } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';

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
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3); // Default to last 3 months
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('all');

  const exportOptions: ExportOption[] = [
    {
      id: '1',
      name: 'Financial Statements',
      description: 'Complete financial reports including balance sheet, P&L, and cash flow',
      format: 'Excel (XLSX)',
      icon: <FileSpreadsheet size={24} className="text-emerald-400" />,
      endpoint: 'financial-statements'
    },
    {
      id: '2',
      name: 'Tax Reports',
      description: 'GST, TDS, and income tax summaries for filing',
      format: 'Excel (XLSX)',
      icon: <FileText size={24} className="text-blue-400" />,
      endpoint: 'tax-reports'
    },
    {
      id: '3',
      name: 'Expense Ledger',
      description: 'Detailed expense transactions with categories',
      format: 'Excel (XLSX)',
      icon: <FileSpreadsheet size={24} className="text-blue-400" />,
      endpoint: 'expense-ledger'
    },
    {
      id: '4',
      name: 'Revenue Report',
      description: 'Sales and revenue breakdown by period',
      format: 'Excel (XLSX)',
      icon: <FileText size={24} className="text-purple-400" />,
      endpoint: 'revenue-report'
    },
  ];

  const handleExport = async (optionId: string) => {
    try {
      setLoading(optionId);

      if (optionId === '4') { // Revenue Report
        const response = await getSalesReport({ startDate, endDate });
        if (response.success && response.data) {
          const reportData = response.data;
          const rows = reportData.data.map(item => ({
            'Transaction Date': item.date,
            'Vol. Transactions': item.transactions,
            'Gross Revenue': item.revenue,
            'Total Discount': item.discount,
            'Tax (GST)': item.tax,
            'Net Revenue': item.revenue - item.discount
          }));
          exportToExcel(rows, `Revenue-Report-${startDate}-to-${endDate}`, 'Revenue Distribution');
        } else {
          throw new Error(response.message || 'Failed to fetch sales data');
        }
      } 
      else if (optionId === '3') { // Expense Ledger
        const response = await getExpenses();
        if (response.success && response.data) {
          const filtered = response.data.filter(e => {
            const d = new Date(e.date);
            return d >= new Date(startDate) && d <= new Date(endDate);
          });
          const rows = filtered.map(e => ({
            'Ref ID': e.id.slice(-8).toUpperCase(),
            'Record Date': e.date,
            'Expense Category': e.customCategoryId ? 'Custom Category' : getCategoryLabel(e.category),
            'Description': e.description,
            'Settled Amount': Number(e.amount),
            'Payment Notes': e.notes || '—'
          }));
          exportToExcel(rows, `Expense-Ledger-${startDate}-to-${endDate}`, 'Expense Statement');
        } else {
          throw new Error('Failed to fetch expense data');
        }
      } 
      else if (optionId === '2') { // Tax Reports
        const response = await getSalesReport({ startDate, endDate });
        if (response.success && response.data) {
          const summary = response.data.summary;
          const rows = [
            { 'Tax Metric': 'Total Collected Revenue', 'Value (PKR)': summary.totalRevenue },
            { 'Tax Metric': 'Estimated Tax Liability', 'Value (PKR)': summary.totalTax },
            { 'Tax Metric': 'Effective Tax Rate', 'Value (PKR)': ((summary.totalTax / (summary.totalRevenue || 1)) * 100).toFixed(2) + '%' },
            { 'Tax Metric': 'Reporting Period Start', 'Value (PKR)': startDate },
            { 'Tax Metric': 'Reporting Period End', 'Value (PKR)': endDate }
          ];
          exportToExcel(rows, `Tax-Exemption-Report-${startDate}-to-${endDate}`, 'Audit Summary');
        } else {
          throw new Error(response.message || 'Failed to generate tax report');
        }
      } 
      else { // Financial Statements (P&L)
        const response = await getProfitAndLoss({ startDate, endDate });
        if (response.success && response.data) {
          const pl = response.data;
          const rows = [
            { 'Ledger Section': 'REVENUE', 'Account Label': 'Gross Sales Revenue', 'Amount (PKR)': pl.revenue },
            { 'Ledger Section': 'COGS', 'Account Label': 'Cost of Goods Sold (Inventory)', 'Amount (PKR)': pl.cogs },
            { 'Ledger Section': 'PROFIT', 'Account Label': 'Gross Operating Profit', 'Amount (PKR)': pl.grossProfit },
            { 'Ledger Section': 'PROFIT', 'Account Label': 'Gross Margin Ratio', 'Amount (PKR)': (pl.grossMargin * 100).toFixed(2) + '%' },
            { 'Ledger Section': 'EXPENSES', 'Account Label': 'Operational Overhead', 'Amount (PKR)': pl.operatingExpenses },
            { 'Ledger Section': 'EXPENSES', 'Account Label': 'Salary & Payroll', 'Amount (PKR)': pl.salaries },
            { 'Ledger Section': 'EXPENSES', 'Account Label': 'Total Operating Expenses', 'Amount (PKR)': pl.totalExpenses },
            { 'Ledger Section': 'NET EARNINGS', 'Account Label': 'Net Profit After Expense', 'Amount (PKR)': pl.netProfit },
            { 'Ledger Section': 'NET EARNINGS', 'Account Label': 'Net Margin Ratio', 'Amount (PKR)': (pl.netMargin * 100).toFixed(2) + '%' }
          ];
          exportToExcel(rows, `Income-Statement-${startDate}-to-${endDate}`, 'P&L Statement');
        } else {
          throw new Error(response.message || 'Failed to fetch P&L data');
        }
      }
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message || 'Internal connection error'}`);
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    alert('Exporting all reports - This would generate a ZIP file with all reports');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Export Financial Data"
        description="Download reports in multiple formats"
        icon={Download}
        primaryAction={{
          label: "Export All",
          icon: Download,
          onClick: handleExportAll
        }}
      />

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Available Reports"
          value={exportOptions.length}
          icon={FileSpreadsheet}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Date Range"
          value={`${startDate} - ${endDate}`}
          icon={Calendar}
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
        />
        <MetricCard
          title="Active Filter"
          value={filterCategory === 'all' ? 'All Categories' : filterCategory}
          icon={Filter}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {exportOptions.map((option) => (
          <div
            key={option.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
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
              className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === option.id ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></span>
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-blue-500" />
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

        <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-500 transition-all">
          + Schedule New Export
        </button>
      </div>
    </div>
  );
};

export default ExportData;
