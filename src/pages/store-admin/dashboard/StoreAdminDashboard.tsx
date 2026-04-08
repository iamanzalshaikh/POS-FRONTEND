import { useState, useMemo, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import DashboardGrid from './components/DashboardGrid';
import MonthlyActivityChart from '@/components/global-components/monthly-activity-chart';
import StatsCards from '@/components/global-components/StatsCards';

import CategoryPieChart from './components/CategoryPieChart';
import ActiveDevicesPanel from './components/ActiveDevicesPanel';
import TopProductsTable from './components/TopProductsTable';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
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

  const [dashRes, setDashRes] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<any>(null);

  const [devicesRes, setDevicesRes] = useState<any>(null);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesError, setDevicesError] = useState<any>(null);

  const [invRes, setInvRes] = useState<any>(null);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<any>(null);

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

  const loadDashboardData = async () => {
    const { startDate, endDate } = calculateDateRange(dateRange);
    
    // Summary
    setDashLoading(true);
    setDashError(null);
    try {
      const res = await getDashboardSummary({ startDate, endDate });
      setDashRes(res);
    } catch (err) {
      setDashError(err);
    } finally {
      setDashLoading(false);
    }

    // Devices (only if not loaded or periodic) - for now just reload
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const res = await deviceApi.fetchDevices();
      setDevicesRes(res);
    } catch (err) {
      setDevicesError(err);
    } finally {
      setDevicesLoading(false);
    }

    // Inventory
    setInvLoading(true);
    setInvError(null);
    try {
      const res = await getInventory();
      setInvRes(res);
    } catch (err) {
      setInvError(err);
    } finally {
      setInvLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loading = dashLoading || devicesLoading || invLoading;
  const isConnectionError = [dashError, devicesError, invError].some((e: any) => e && !e.response);
  const error = dashError || devicesError || invError 
    ? (isConnectionError ? 'System connection failed. Is the backend running?' : 'Failed to synchronize analytics.') 
    : null;

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
        { value: s.totalRefunds ?? 0 },
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
      stat: `${Number(data.metrics?.[1]?.value ?? 0).toLocaleString()}`,
      change: "+5.1%",
      changeType: "positive" as const,
      linkTo: "/store-admin/sales"
    },
    {
      name: "Inventory Alerts",
      stat: `${Number(data.metrics?.[2]?.value ?? 0).toLocaleString()}`,
      change: "0%",
      changeType: "positive" as const,
      linkTo: "/store-admin/inventory/stocks"
    },
    {
      name: "Total Refunds",
      stat: `${Number(data.metrics?.[3]?.value ?? 0).toLocaleString()}`,
      change: "-2.1%",
      changeType: "negative" as const,
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

        {/* Unified Activity Chart */}
        <div className="xl:col-span-8">
          <MonthlyActivityChart
            title="Revenue Performance"
            subtitle={`Consolidated data for ${dateRange}`}
            data={(() => {
              // Get last 6 months for a continuous X-axis
              interface MonthPoint { month: string; monthIndex: number; year: number; activity: number; }
              const months: MonthPoint[] = [];
              const now = new Date();
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({ 
                  month: d.toLocaleDateString('en-US', { month: 'short' }),
                  monthIndex: d.getMonth(),
                  year: d.getFullYear(),
                  activity: 0 
                });
              }

              // Merge from backend weekly Revenue (aggregated by month)
              data?.weeklyRevenue.forEach(d => {
                const date = new Date(d.week);
                const match = months.find(m => m.monthIndex === date.getMonth() && m.year === date.getFullYear());
                if (match) {
                  match.activity += d.revenue;
                }
              });

              return months.map(({ month, activity }) => ({ month, activity }));
            })()}
            isLoading={dashLoading}
            height={260}
            isCurrency={true}
            unit="PKR"
          />
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
