import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { getSalesReport, getInventoryReport } from '../../api/finance.api';
import type { SalesReportData, InventoryReportData } from '../../api/finance.api';

interface MonthlyCloseData {
  period: {
    startDate: string;
    endDate: string;
  };
  sales: {
    totalRevenue: number;
    totalTransactions: number;
    totalDiscount: number;
    totalTax: number;
    netRevenue: number;
  };
  inventory: {
    openingStock?: number;
    closingStock: number;
    stockValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  profit: {
    grossProfit: number;
    grossMargin: number;
  };
}

const MonthlyCloseReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MonthlyCloseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    fetchMonthlyData();
  }, [selectedMonth]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate month start and end dates
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Fetch sales and inventory data
      const [salesResponse, inventoryResponse] = await Promise.all([
        getSalesReport({ startDate, endDate }),
        getInventoryReport()
      ]);

      if (!salesResponse.success || !inventoryResponse.success) {
        throw new Error('Failed to fetch data');
      }

      const salesData = salesResponse.data as SalesReportData;
      const inventoryData = inventoryResponse.data as InventoryReportData;

      // Calculate metrics
      const totalRevenue = salesData.summary.totalRevenue;
      const totalDiscount = salesData.summary.totalDiscount;
      const totalTax = salesData.summary.totalTax;
      const netRevenue = totalRevenue - totalDiscount - totalTax;

      // Estimate COGS (in production, backend should provide this)
      // Using 70% of revenue as estimated COGS
      const estimatedCOGS = totalRevenue * 0.70;
      const grossProfit = netRevenue - estimatedCOGS;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      setData({
        period: {
          startDate,
          endDate
        },
        sales: {
          totalRevenue,
          totalTransactions: salesData.summary.totalTransactions,
          totalDiscount,
          totalTax,
          netRevenue
        },
        inventory: {
          closingStock: inventoryData.summary.totalStockValue,
          stockValuation: inventoryData.summary.totalStockValue,
          lowStockCount: inventoryData.summary.lowStockCount,
          outOfStockCount: inventoryData.summary.outOfStockCount
        },
        profit: {
          grossProfit,
          grossMargin
        }
      });
    } catch (err: any) {
      console.error('Failed to fetch monthly close data:', err);
      setError(err.message || 'Failed to load monthly close report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm font-bold text-slate-500">Loading monthly close report...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-slate-400">No data available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Month Selector */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText size={28} className="text-amber-400" />
              Monthly Close Report
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-2">
              Financial summary and closing statement
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-lg font-black text-amber-900 mb-2">
            {getMonthName(selectedMonth)}
          </h3>
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            {data.period.startDate} to {data.period.endDate}
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign size={24} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Revenue</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {formatCurrency(data.sales.totalRevenue)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            <span className="text-xs font-bold text-slate-500">
              {data.sales.totalTransactions} transactions
            </span>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <DollarSign size={24} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Net Revenue</span>
          </div>
          <div className="text-3xl font-black text-blue-600">
            {formatCurrency(data.sales.netRevenue)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              After discounts & tax
            </span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <TrendingUp size={24} className="text-amber-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gross Profit</span>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {formatCurrency(data.profit.grossProfit)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600">
              {data.profit.grossMargin.toFixed(1)}% margin
            </span>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <FileText size={24} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Stock Value</span>
          </div>
          <div className="text-3xl font-black text-purple-600">
            {formatCurrency(data.inventory.closingStock)}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Closing valuation
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Breakdown */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <DollarSign size={20} className="text-emerald-400" />
            Sales Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Gross Revenue</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.sales.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Discounts Given</span>
              <span className="text-sm font-black text-red-600">-{formatCurrency(data.sales.totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Tax Collected</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.sales.totalTax)}</span>
            </div>
            <div className="flex justify-between items-center py-3 pt-4">
              <span className="text-sm font-black uppercase text-slate-700 tracking-widest">Net Revenue</span>
              <span className="text-lg font-black text-emerald-600">{formatCurrency(data.sales.netRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
            <FileText size={20} className="text-purple-400" />
            Inventory Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Closing Stock Value</span>
              <span className="text-sm font-black text-slate-900">{formatCurrency(data.inventory.closingStock)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Low Stock Items</span>
              <span className="text-sm font-black text-amber-600">{data.inventory.lowStockCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-600">Out of Stock Items</span>
              <span className="text-sm font-black text-red-600">{data.inventory.outOfStockCount}</span>
            </div>
            <div className="flex justify-between items-center py-3 pt-4">
              <span className="text-sm font-black uppercase text-slate-700 tracking-widest">Stock Health</span>
              {data.inventory.outOfStockCount === 0 && data.inventory.lowStockCount === 0 ? (
                <span className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <span className="text-sm font-black">Excellent</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-amber-600">
                  <AlertCircle size={16} />
                  <span className="text-sm font-black">Needs Attention</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      {(data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <h3 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-3">
            <AlertCircle size={20} />
            Action Required
          </h3>
          <div className="space-y-3">
            {data.inventory.outOfStockCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900">
                    {data.inventory.outOfStockCount} product(s) out of stock
                  </p>
                  <p className="text-xs font-bold text-red-700 mt-1">
                    Immediate replenishment required
                  </p>
                </div>
              </div>
            )}
            {data.inventory.lowStockCount > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {data.inventory.lowStockCount} product(s) below reorder level
                  </p>
                  <p className="text-xs font-bold text-amber-700 mt-1">
                    Consider placing purchase orders
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCloseReport;
