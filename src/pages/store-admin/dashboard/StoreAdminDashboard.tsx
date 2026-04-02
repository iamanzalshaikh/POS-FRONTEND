import { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import DashboardGrid from './components/DashboardGrid';
import ChartAreaAxes from '@/components/global-components/chart-line-dots';
import BarChartLabelCustom from '@/components/global-components/BarChartLabelCustom';
import StatsCards from '@/components/global-components/StatsCards';

import CategoryPieChart from './components/CategoryPieChart';
import ActiveDevicesPanel from './components/ActiveDevicesPanel';
import TopProductsTable from './components/TopProductsTable';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getInventory } from '@/api/dashboard.api';
import * as deviceApi from '@/api/devices.api';

interface DashboardView {
  metrics: { value: number }[];
  dailySales: { date: string; sales: number }[];
  weeklyRevenue: { week: string; revenue: number }[];
  categories: { name: string; value: number; color: string }[];
  devices: { id: string; name: string; location: string; status: 'online' | 'offline' }[];
  topProducts: { id: string; name: string; sku: string; unitsSold: number; revenue: number; stockLevel: number }[];
}

export default function StoreAdminDashboard() {
  const [dateRange, setDateRange] = useState('7D'); // 7D, 30D, Today

  const calculateDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    if (range === 'Today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === '7D') {
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    } else if (range === '30D') {
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = calculateDateRange(dateRange);
  const { data: dashRes, isLoading: dashLoading, error: dashError } = useQuery({
    queryKey: ['dashboard', 'summary', { startDate, endDate }],
    queryFn: () => getDashboardSummary({ startDate, endDate }),
  });
  const { data: devicesRes, isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceApi.fetchDevices(),
  });
  const { data: invRes, isLoading: invLoading } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: () => getInventory(),
  });

  const loading = dashLoading || devicesLoading || invLoading;
  const error = dashError ? (dashError as any).message : null;

  const raw = (dashRes as any)?.data ?? null;
  const deviceData = (devicesRes as any)?.data ?? [];

  const data: DashboardView | null = useMemo(() => {
    if (!raw) return null;

    const s = raw.summary ?? {};
    const inv = raw.inventory ?? {};
    const charts = raw.charts ?? {};
    const revByDate = charts.revenueByDate ?? [];
    const payBreakdown = charts.paymentBreakdown ?? [];
    const topProductsRaw = raw.topProducts ?? [];
    const invItems = (invRes as any)?.data ?? [];
    const stockMap = invItems.reduce((acc: any, item: any) => {
      acc[item.productId] = {
        quantity: item.totalQuantity,
        reorderLevel: item.product?.reorderLevel || 10
      };
      return acc;
    }, {});

    const colors = ['#262255', '#24608F', '#508CBB', '#7CB8E7', '#A8D4F3'];
    return {
      metrics: [
        { value: s.totalRevenue ?? 0 },
        { value: s.totalTransactions ?? 0 },
        { value: (inv.lowStockCount ?? 0) + (inv.outOfStockCount ?? 0) },
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
      topProducts: topProductsRaw.map((p: { productId?: string; id?: string; name?: string; sku?: string; quantitySold?: number; revenue?: number }) => {
        const productId = p.productId ?? p.id ?? '';
        const invInfo = stockMap[productId];
        const currentStock = invInfo?.quantity ?? 0;
        const reorder = invInfo?.reorderLevel ?? 10;

        // Calculate stock health percentage for UI progress bar
        // 100% means currentStock >= reorder * 2 (Healthy)
        // 50% means currentStock == reorder
        // Below 50% means approaching reorder level
        const stockLevel = Math.min(100, Math.round((currentStock / (reorder * 2 || 20)) * 100));

        return {
          id: productId,
          name: p.name ?? 'Unknown',
          sku: p.sku ?? '',
          unitsSold: p.quantitySold ?? 0,
          revenue: p.revenue ?? 0,
          stockLevel,
        };
      }),
    };
  }, [raw, deviceData, invRes]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest animate-pulse">Initializing Console...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[40px] shadow-xl max-w-md border border-slate-100 dark:border-slate-800">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">System Error</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">{error || 'Failed to establish connection to POS core.'}</p>
          <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-95">
            Emergency Reload
          </button>
        </div>
      </div>
    );
  }

  const statsData = [
    {
      name: "Total Revenue",
      stat: formatCurrency(data.metrics?.[0]?.value ?? 0),
      change: "+12.5%",
      changeType: "positive" as const,
      linkTo: "/store-admin/reports"
    },
    {
      name: "Active Sales",
      stat: `${data.metrics?.[1]?.value ?? 0}`,
      change: "+5.1%",
      changeType: "positive" as const,
      linkTo: "/store-admin/sales"
    },
    {
      name: "Inventory Alerts",
      stat: `${data.metrics?.[2]?.value ?? 0}`,
      change: "0%",
      changeType: "positive" as const,
      linkTo: "/store-admin/inventory/stocks"
    },
    {
      name: "Total Orders",
      stat: `${Number(data.metrics?.[3]?.value ?? 0).toLocaleString()}`,
      change: "+8.4%",
      changeType: "positive" as const,
      linkTo: "/store-admin/sales"
    },
    {
      name: "Total Discounts",
      stat: formatCurrency(data.metrics?.[4]?.value ?? 0),
      change: "+2.1%",
      changeType: "positive" as const,
      linkTo: "/store-admin/reports"
    }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Console Overview</h1>
          <p className="text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Real-time Analytics & Performance</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          {['Today', '7D', '30D'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "px-6 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
                dateRange === range
                  ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-lg shadow-slate-200 dark:shadow-none"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <DashboardGrid>
        <div className="xl:col-span-12">
          <StatsCards data={statsData} />
        </div>

        {/* Row 1: Charts & Pie Chart */}
        <div className="xl:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col group transition-all duration-500 hover:shadow-xl dark:hover:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Daily Sales Revenue</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium font-bold uppercase tracking-widest mt-1">Daily trend in period</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shadow-blue-100 dark:shadow-none"></span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revenue</span>
                </div>
              </div>
              <div className="flex-1 min-h-[220px]">
                <ChartAreaAxes
                  data={data?.dailySales.map(d => ({ date: d.date, sales: d.sales })) ?? []}
                  className="h-[220px]"
                  noWrapper
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm h-full flex flex-col group transition-all duration-500 hover:shadow-xl dark:hover:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Revenue Trend</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-medium font-bold uppercase tracking-widest mt-1">Comparative performance</p>
                </div>
                <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Bar View</span>
                </div>
              </div>
              {data?.weeklyRevenue && data.weeklyRevenue.length > 0 ? (
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
                  <p className="font-inter text-slate-400 font-bold text-sm">No revenue data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="xl:col-span-4">
          <CategoryPieChart data={data?.categories ?? []} />
        </div>

        {/* Row 2: Top Selling Inventory & Active Devices */}
        <div className="xl:col-span-8">
          <TopProductsTable products={data?.topProducts ?? []} />
        </div>
        <div className="xl:col-span-4">
          <ActiveDevicesPanel devices={data?.devices ?? []} />
        </div>
      </DashboardGrid>
    </div>
  );
}
