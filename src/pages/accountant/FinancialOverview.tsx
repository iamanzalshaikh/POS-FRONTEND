import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { getSalesTransactions } from '../../api/finance.api';

interface SalesData {
  id: string;
  totalAmount: number;
  totalTax: number;
  discountAmount: number;
  subtotal: number;
  createdAt: string;
  paymentMethod: string;
}

interface ProcessedData {
  revenueByDate: Array<{ date: string; revenue: number; transactions: number }>;
  summary: {
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    totalTransactions: number;
  };
}

const FinancialOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        // Get last 7 days of sales
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const response = await getSalesTransactions({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 100
        });

        console.log('📊 [FinancialOverview] API Response:', response);

        // Check if response is successful (our standardized API returns success at root)
        if (response && 'success' in response && response.success) {
          const sales: SalesData[] = (response as any).data || [];
          
          console.log('📊 [FinancialOverview] Found', sales.length, 'sales');

          // Filter only completed, non-cancelled sales
          const validSales = sales.filter(s =>
            s.totalAmount &&
            !s.isCancelled &&
            s.paymentStatus === 'COMPLETED'
          );

          console.log('📊 [FinancialOverview] Valid sales:', validSales.length);

          // Group by date
          const byDate: Record<string, { revenue: number; transactions: number }> = {};
          let totalRevenue = 0;
          let totalTax = 0;
          let totalDiscount = 0;

          validSales.forEach(sale => {
            const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
            if (!byDate[dateKey]) {
              byDate[dateKey] = { revenue: 0, transactions: 0 };
            }
            byDate[dateKey].revenue += Number(sale.totalAmount);
            byDate[dateKey].transactions += 1;
            totalRevenue += Number(sale.totalAmount);
            totalTax += Number(sale.totalTax);
            totalDiscount += Number(sale.discountAmount);
          });

          // Convert to array and sort by date
          const revenueByDate = Object.entries(byDate)
            .map(([date, values]) => ({
              date,
              revenue: values.revenue,
              transactions: values.transactions
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

          console.log('📊 [FinancialOverview] Revenue by date:', revenueByDate);

          setData({
            revenueByDate,
            summary: {
              totalRevenue,
              totalTax,
              totalDiscount,
              totalTransactions: validSales.length
            }
          });
        } else if (response && 'success' in response && !response.success) {
          console.error('❌ [FinancialOverview] API returned error:', response);
          setError((response as any).message || 'Failed to load financial data');
        }
      } catch (err: any) {
        console.error('Failed to fetch financial data:', err);
        setError(err.message || 'Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-bold text-slate-500">Loading financial data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="text-center text-red-500">
          <p className="text-sm font-bold">{error}</p>
        </div>
      </div>
    );
  }

  const revenueByDate = data?.revenueByDate || [];
  const maxRevenue = Math.max(...revenueByDate.map(d => d.revenue), 1);

  return (
    <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <BarChart3 size={24} className="mr-3 text-amber-400" />
          Financial Health
        </h2>
        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
          Last 7 Days
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-48 flex items-end space-x-3">
          {revenueByDate.length > 0 ? (
            revenueByDate.map((day, i) => {
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-amber-500/10 hover:bg-amber-500/30 transition-all rounded-t-xl group/bar relative"
                  style={{ height: `${heightPercent}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity text-[10px] font-black text-amber-400 whitespace-nowrap">
                    ${day.revenue.toLocaleString()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
              No data available
            </div>
          )}
        </div>
        <div className="flex justify-between text-[10px] font-black text-slate-600 tracking-tighter px-2">
          {revenueByDate.length > 0 ? (
            revenueByDate.map((day, i) => (
              <span key={i}>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
            ))
          ) : (
            <span className="w-full text-center">No data</span>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <TrendingUp size={16} className="text-emerald-400" />
            <div className="text-xs font-bold text-slate-500">
              Net Profit
              <span className="text-slate-900 ml-1">
                ${data?.summary ? (data.summary.totalRevenue - data.summary.totalTax - data.summary.totalDiscount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TrendingDown size={16} className="text-red-400" />
            <div className="text-xs font-bold text-slate-500">
              Total Tax
              <span className="text-slate-900 ml-1">${data?.summary?.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialOverview;
