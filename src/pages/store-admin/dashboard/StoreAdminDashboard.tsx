import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import DashboardGrid from './components/DashboardGrid';
import ChartLineDots from '@/components/global-components/chart-line-dots';
import BarChartLabelCustom from '@/components/global-components/BarChartLabelCustom';
import StatsCards from '@/components/global-components/StatsCards';

import CategoryPieChart from './components/CategoryPieChart';
import ActiveDevicesPanel from './components/ActiveDevicesPanel';
import TopProductsTable from './components/TopProductsTable';

import { getDashboardSummary } from '@/api/dashboard.api';
import { getDevices } from '@/api/dashboard.api';

interface DashboardView {
  metrics: { value: number }[];
  dailySales: { date: string; sales: number }[];
  weeklyRevenue: { week: string; revenue: number }[];
  categories: { name: string; value: number; color: string }[];
  devices: { id: string; name: string; location: string; status: 'online' | 'offline' }[];
  topProducts: { id: string; name: string; sku: string; unitsSold: number; revenue: number; stockLevel: number }[];
}

export default function StoreAdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<DashboardView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, devicesRes] = await Promise.all([
          getDashboardSummary(),
          getDevices()
        ]);

        const raw = dashRes.data?.data ?? null;
        const deviceData = devicesRes.data?.data ?? [];

        if (!raw) {
          setData(null);
          return;
        }
        const s = raw.summary ?? {};
        const today = raw.today ?? {};
        const inv = raw.inventory ?? {};
        const charts = raw.charts ?? {};
        const revByDate = charts.revenueByDate ?? [];
        const payBreakdown = charts.paymentBreakdown ?? [];
        const topProducts = raw.topProducts ?? [];

        const colors = ['#262255', '#24608F', '#508CBB', '#7CB8E7', '#A8D4F3'];
        setData({
          metrics: [
            { value: s.totalRevenue ?? 0 },
            { value: today.transactions ?? s.totalTransactions ?? 0 },
            { value: inv.lowStockCount ?? 0 },
            { value: s.totalTransactions ?? 0 },
            { value: s.totalDiscount ?? 0 },
          ],
          dailySales: revByDate.map((d: { date?: string; revenue?: number }) => ({ date: d.date ?? '', sales: d.revenue ?? 0 })),
          weeklyRevenue: revByDate.map((d: { date?: string; revenue?: number }) => ({ week: d.date ?? '', revenue: d.revenue ?? 0 })),
          categories: payBreakdown.map((p: { paymentMethod?: string; revenue?: number }, i: number) => ({
            name: p.paymentMethod ?? 'Other',
            value: p.revenue ?? 0,
            color: colors[i % colors.length],
          })),
          devices: deviceData.map((d: any) => ({
            id: d.id,
            name: d.deviceName || d.name || 'Unknown Device',
            location: d.location || 'Main Floor',
            status: d.isActive ? 'online' : 'offline',
          })),
          topProducts: topProducts.map((p: { productId?: string; id?: string; name?: string; sku?: string; quantitySold?: number; revenue?: number }) => ({
            id: p.productId ?? p.id ?? '',
            name: p.name ?? 'Unknown',
            sku: p.sku ?? '',
            unitsSold: p.quantitySold ?? 0,
            revenue: p.revenue ?? 0,
            stockLevel: 50,
          })),
        });
      } catch (err: unknown) {
        console.error('Failed to load store admin dashboard', err);
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
        setError(msg || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Console...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-xl max-w-md border border-slate-100">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">System Error</h2>
          <p className="text-slate-500 font-medium mb-8">{error || 'Failed to establish connection to POS core.'}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
            Emergency Reload
          </button>
        </div>
      </div>
    );
  }
  const statsData = [
    { name: "Total Revenue", stat: `₹ ${Number(data.metrics?.[0]?.value ?? 0).toLocaleString()}`, change: "+12.5%", changeType: "positive" as const },
    { name: "Active Sales", stat: `${data.metrics?.[1]?.value ?? 0}`, change: "+5.1%", changeType: "positive" as const },
    { name: "Inventory Alerts", stat: `${data.metrics?.[2]?.value ?? 0}`, change: "0%", changeType: "positive" as const },
    { name: "Total Orders", stat: `${Number(data.metrics?.[3]?.value ?? 0).toLocaleString()}`, change: "+8.4%", changeType: "positive" as const }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] transition-colors duration-500 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <DashboardGrid>
          <div className="xl:col-span-12">
            <StatsCards data={statsData} />
          </div>
          {/* Row 1: Charts & Pie Chart */}
          <div className="xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Daily Sales Revenue</h3>
                    <p className="text-xs text-slate-500 font-medium">Performance over the last 7 days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-100"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</span>
                  </div>
                </div>
                <ChartLineDots noWrapper data={data?.dailySales ?? []} />

              </div>
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
            </div>
          </div>
          <div className="xl:col-span-4">
            <CategoryPieChart data={data.categories ?? []} />
          </div>

          {/* Row 2: Top Selling Inventory & Active Devices */}
          <div className="xl:col-span-8">
            <TopProductsTable products={data.topProducts ?? []} />
          </div>
          <div className="xl:col-span-4">
            <ActiveDevicesPanel devices={data.devices ?? []} />
          </div>
        </DashboardGrid>
      </div>
    </div>
  );
}
