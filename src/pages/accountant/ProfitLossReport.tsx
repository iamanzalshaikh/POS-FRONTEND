import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { getProfitAndLoss } from '../../api/finance.api';
import type { ProfitLossData } from '../../api/finance.api';
import { formatCurrency } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';

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

        console.log('📊 [ProfitLossReport] Fetching P&L data from new API...');
        const response = await getProfitAndLoss({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        console.log('📊 [ProfitLossReport] API Response:', response);

        if (response.success && response.data) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to load P&L data');
        }
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
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPeriodLabel = () => {
    const days = Math.ceil((new Date(data.period.endDate).getTime() - new Date(data.period.startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 31) return 'Last Month';
    if (days <= 93) return 'Last Quarter';
    if (days <= 186) return 'Last 6 Months';
    return 'Last 12 Months';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
              <PieChart className="w-6 h-6 text-blue-500" />
              Profit & Loss Statement
            </h2>
            <p className="text-sm text-slate-500 mt-1">Comprehensive financial performance report</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{getPeriodLabel()}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(data.grossProfit)}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Operating Expenses"
          value={formatCurrency(data.operatingExpenses)}
          icon={ArrowDownRight}
          colorClass="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(data.netProfit)}
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Profit Margin"
          value={`${data.netMargin.toFixed(1)}%`}
          icon={PieChart}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
      </div>

      {/* Profit & Loss Statement */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Detailed Statement</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
            {formatDate(data.period.startDate)} to {formatDate(data.period.endDate)}
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Revenue Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Revenue</h3>
              <span className="text-lg font-black text-emerald-600">+{formatCurrency(data.revenue)}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Product Sales</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(data.revenue)}</span>
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
              <span className="text-lg font-black text-red-600">-{formatCurrency(data.cogs)}</span>
            </div>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-sm font-bold text-slate-700">Cost of Sold Items</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(data.cogs)}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-6 py-3">
                      <span className="text-xs font-bold text-slate-500">Calculated as: SUM(cost_price × quantity_sold)</span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs font-bold text-slate-400">Not total inventory value</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Operating Expenses Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest">Operating Expenses</h3>
              <span className="text-lg font-black text-red-600">-{formatCurrency(data.operatingExpenses)}</span>
            </div>
            {Object.entries(data.expenseByCategory).length > 0 ? (
              <div className="bg-slate-50 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {Object.entries(data.expenseByCategory).map(([category, amount], idx) => {
                      const percentage = data.operatingExpenses > 0 ? (amount / data.operatingExpenses) * 100 : 0;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="px-6 py-3">
                            <span className="text-sm font-bold text-slate-700">{category}</span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className="text-sm font-black text-slate-900">{formatCurrency(amount)}</span>
                            <span className="text-[10px] font-bold text-slate-500 ml-2">({percentage.toFixed(1)}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-8 text-center text-slate-400">
                <p className="text-sm font-bold">No operating expenses recorded</p>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Revenue</span>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(data.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Cost of Goods Sold</span>
              <span className="text-lg font-black text-red-600">-{formatCurrency(data.cogs)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-slate-200">
              <span className="text-sm font-black text-slate-700">Gross Profit</span>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(data.grossProfit)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Operating Expenses</span>
              <span className="text-lg font-black text-red-600">-{formatCurrency(data.operatingExpenses)}</span>
            </div>
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border-2 border-blue-200">
              <div>
                <span className="text-base font-black uppercase text-blue-900 tracking-widest">Net Profit</span>
                <div className="text-[10px] font-bold text-blue-700 mt-1">
                  {data.netMargin.toFixed(1)}% net margin
                </div>
              </div>
              <span className="text-3xl font-black text-blue-600">{formatCurrency(data.netProfit)}</span>
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
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Profit Margin</span>
              <span className="text-sm font-black text-emerald-600">{data.grossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operating Expense Ratio</span>
              <span className="text-sm font-black text-slate-900">{data.expenseRatio.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Profit Margin</span>
              <span className="text-sm font-black text-emerald-600">{data.netMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Period Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</span>
              <span className="text-sm font-black text-slate-900">{formatDate(data.period.startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</span>
              <span className="text-sm font-black text-slate-900">{formatDate(data.period.endDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Sales</span>
              <span className="text-sm font-black text-emerald-600">{data.metrics.totalSales} transactions</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Expenses</span>
              <span className="text-sm font-black text-slate-900">{data.metrics.totalExpenses} records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossReport;
