import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getSalesReport, getInventoryReport } from '../../api/finance.api';

interface ProfitLossData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  profitMargin: number;
}

const ProfitLossReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfitLossData = async () => {
      try {
        setLoading(true);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // Last quarter

        console.log('📊 [ProfitLossReport] Fetching P&L data...');
        const [salesResponse, inventoryResponse] = await Promise.all([
          getSalesReport({
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }),
          getInventoryReport()
        ]);

        console.log('📊 [ProfitLossReport] Sales Response:', salesResponse);
        console.log('📊 [ProfitLossReport] Inventory Response:', inventoryResponse);

        let totalRevenue = 0;
        let totalCOGS = 0;

        if (salesResponse && 'success' in salesResponse && salesResponse.success) {
          totalRevenue = (salesResponse.data as any)?.summary?.totalRevenue || 0;
          console.log('📊 [ProfitLossReport] Total Revenue:', totalRevenue);
        }

        if (inventoryResponse && 'success' in inventoryResponse && inventoryResponse.success) {
          totalCOGS = (inventoryResponse.data as any)?.summary?.totalStockValue || 0;
          console.log('📊 [ProfitLossReport] Total COGS:', totalCOGS);
        }

        const grossProfit = totalRevenue - totalCOGS;
        const operatingExpenses = totalRevenue * 0.18; // Estimated 18% operating expenses
        const netProfit = grossProfit - operatingExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        setData({
          revenue: totalRevenue,
          cogs: totalCOGS,
          grossProfit,
          operatingExpenses,
          netProfit,
          profitMargin
        });
      } catch (err: any) {
        console.error('Failed to fetch P&L data:', err);
        setError(err.message || 'Failed to load P&L data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfitLossData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm font-bold text-slate-500">Loading P&L statement...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-slate-400">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gross Profit</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">₹{data.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="flex items-center space-x-1 mt-2">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-600">+18.3%</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <ArrowDownRight size={24} className="text-red-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Op. Expenses</span>
          </div>
          <div className="text-3xl font-black text-red-600">₹{data.operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="flex items-center space-x-1 mt-2">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-[10px] font-black text-red-600">-5.2%</span>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Net Profit</span>
          </div>
          <div className="text-3xl font-black text-amber-600">₹{data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-500 font-black uppercase mt-2">This Quarter</div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <PieChart size={24} className="text-blue-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Profit Margin</span>
          </div>
          <div className="text-3xl font-black text-blue-600">{data.profitMargin.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-500 font-black uppercase mt-2">Net Margin</div>
        </div>
      </div>

      {/* Profit & Loss Statement */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Q1 2025 Financial Report</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Revenue Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Revenue</h3>
              <span className="text-lg font-black text-emerald-600">+₹{data.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Product Sales</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.revenue * 0.85).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Service Revenue</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.revenue * 0.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Other Income</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.revenue * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* COGS Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Cost of Goods Sold</h3>
              <span className="text-lg font-black text-red-600">-₹{data.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Inventory Purchases</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.cogs * 0.77).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Shipping & Freight</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.cogs * 0.13).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Packaging</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">₹{(data.cogs * 0.10).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Gross Profit</span>
              <span className="text-lg font-black text-emerald-600">₹{data.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Operating Expenses</span>
              <span className="text-lg font-black text-red-600">-₹{data.operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center bg-amber-50 px-6 py-4 rounded-2xl border border-amber-200">
              <span className="text-base font-black uppercase text-amber-900 tracking-widest">Net Profit</span>
              <span className="text-2xl font-black text-amber-600">₹{data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Key Financial Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Return on Investment</span>
              <span className="text-sm font-black text-emerald-600">24.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operating Ratio</span>
              <span className="text-sm font-black text-slate-900">68.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Ratio</span>
              <span className="text-sm font-black text-emerald-600">2.1:1</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Year-over-Year Comparison</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue Growth</span>
              <span className="text-sm font-black text-emerald-600">+12.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expense Reduction</span>
              <span className="text-sm font-black text-emerald-600">-5.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Profit Increase</span>
              <span className="text-sm font-black text-emerald-600">+18.3%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReport;
