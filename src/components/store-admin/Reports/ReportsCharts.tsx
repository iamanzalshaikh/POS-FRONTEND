import React from 'react';
import ChartLineDots from '@/components/global-components/chart-line-dots';
import GlobalPieChart from '@/components/global-components/PieChart';

interface ReportsChartsProps {
  charts: any;
}

const ReportsCharts: React.FC<ReportsChartsProps> = ({ charts }) => {
  const revByDate = charts?.revenueByDate ?? [];
  const payBreakdown = charts?.paymentBreakdown ?? [];

  const dailySales = revByDate.map((d: any) => ({
    date: d.date ?? '',
    sales: d.revenue ?? 0,
  }));

  const paymentData = payBreakdown.map((p: any) => ({
    name: p.paymentMethod ?? 'Other',
    value: p.revenue ?? 0,
    fill: p.paymentMethod === 'CASH' ? '#4f46e5' : p.paymentMethod === 'CARD' ? '#818cf8' : '#c7d2fe'
  }));

  const pieConfig = {
    value: { label: "Revenue" },
    CASH: { label: "Cash", color: "#4f46e5" },
    CARD: { label: "Card", color: "#818cf8" },
    OTHER: { label: "Other", color: "#c7d2fe" },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">
      {/* Daily Sales Trend */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group transition-all duration-500 hover:shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue Trend</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Daily revenue performance</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-100"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
          </div>
        </div>
        <div className="flex-1 min-h-[280px]">
          {dailySales.length > 0 ? (
            <ChartLineDots noWrapper data={dailySales} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <p className="font-inter text-slate-400 text-sm font-medium">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group transition-all duration-500 hover:shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Payment Methods</h3>
            <p className="text-xs text-slate-500 font-medium font-bold uppercase tracking-widest mt-1">Revenue by channels</p>
          </div>
          <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest">Breakdown</span>
          </div>
        </div>
        <div className="flex-1 min-h-[280px]">
          {paymentData.length > 0 ? (
            <div className="h-[260px] w-full">
              <GlobalPieChart
                data={paymentData}
                config={pieConfig} 
                dataKey="value"
                nameKey="name"
                noWrapper
                compact
                innerRadius={60}
                outerRadius={80}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <p className="font-inter text-slate-400 text-sm font-medium">No payment data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsCharts;
