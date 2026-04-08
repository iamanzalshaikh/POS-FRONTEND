import React, { useEffect, useState } from 'react';
import { getSalesTransactions } from '../../api/finance.api';
import type { SalesTransaction } from '../../api/finance.api';
import BarChartLabelCustom from '../../components/global-components/BarChartLabelCustom';

interface WeeklyData {
  week: string;
  revenue: number;
}

const FinancialOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ weeklyRevenue: WeeklyData[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);

        const weekEnd = new Date();
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const response = await getSalesTransactions({
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          limit: 200
        });

        let weeklyRevenue: WeeklyData[] = [];

        if (response && 'success' in response && response.success) {
          const sales: SalesTransaction[] = (response as any).data || [];
          const validSales = sales.filter(s =>
            s.totalAmount != null &&
            !(s as any).isCancelled &&
            (s.paymentStatus === 'PAID' || s.paymentStatus === 'COMPLETED')
          );

          const byDate: Record<string, number> = {};
          validSales.forEach(sale => {
            const dateKey = new Date(sale.createdAt).toISOString().split('T')[0];
            byDate[dateKey] = (byDate[dateKey] || 0) + Number(sale.totalAmount);
          });

          weeklyRevenue = Object.entries(byDate)
            .map(([week, revenue]) => ({ week, revenue }))
            .sort((a, b) => a.week.localeCompare(b.week));
        }

        setData({ weeklyRevenue });
      } catch (err: any) {
        setError(err.message || 'Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Console...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-xl max-w-md border border-slate-100">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Error</h2>
          <p className="text-slate-500 font-medium mb-8">{error || 'Failed to establish connection to POS core.'}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
            Emergency Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col group transition-all duration-500 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Weekly Revenue Trend</h3>
          <p className="text-xs text-slate-500 font-medium font-bold uppercase tracking-widest mt-1">Channel performance summary</p>
        </div>
        <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm shadow-blue-50/50">
          <span className="text-[10px] font-black uppercase tracking-widest">+12% vs LY</span>
        </div>
      </div>
      {data.weeklyRevenue && data.weeklyRevenue.length > 0 ? (
        <BarChartLabelCustom
          data={data.weeklyRevenue.map((d: { week: string; revenue: number }) => ({
            label: new Date(d.week).toLocaleDateString('en-US', { weekday: 'short' }),
            value: d.revenue
          }))}
          dataKey="value"
          labelKey="label"
          config={{ value: { label: "Revenue", color: "#262255" } }}
          noWrapper
          height="min-h-[220px]"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-slate-400 font-bold text-sm">No revenue data found</p>
        </div>
      )}
    </div>
  );
};

export default FinancialOverview;
