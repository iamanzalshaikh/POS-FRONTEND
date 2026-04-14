import { useState, useMemo, useEffect } from 'react';
import { 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingCart, 
  PackageOpen, 
  Undo2, 
  BadgePercent 
} from 'lucide-react';
import DashboardGrid from './components/DashboardGrid';
import MonthlyActivityChart from '@/components/global-components/monthly-activity-chart';
import StatsCards from '@/components/global-components/StatsCards';
import { Button } from '@/components/ui/button';

import CategoryPieChart from './components/CategoryPieChart';
import ActiveDevicesPanel from './components/ActiveDevicesPanel';
import TopProductsTable from './components/TopProductsTable';
import MetricCard from '@/components/global-components/MetricCard';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';
import { formatCurrency, toLocalYMD } from '@/utils/format';
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
      startDate: toLocalYMD(start),
      endDate: toLocalYMD(end)
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
    
    // Automatic Refresh Logic
    // Keeps the dashboard and device status fresh (every 2 minutes)
    const refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 120000); // 2 minutes

    return () => clearInterval(refreshInterval);
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
    const invItemsRaw = (invRes as any)?.data ?? [];
    const invItems = Array.isArray(invItemsRaw) ? invItemsRaw : (invItemsRaw.data ?? []);
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
      devices: deviceData.map((d: any) => {
        const lastActive = d.lastActiveAt ? new Date(d.lastActiveAt).getTime() : 0;
        const now = new Date().getTime();
        const isRecent = (now - lastActive) < (5 * 60 * 1000); // 5 minutes threshold
        
        return {
          id: d.id,
          name: d.deviceName || d.name || 'Unknown Device',
          location: d.location || 'Main Floor',
          status: (d.isActive && isRecent) ? 'online' : 'offline',
        };
      }),
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
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-2">
             <Skeleton className="h-8 w-16 rounded-xl" />
             <Skeleton className="h-8 w-16 rounded-xl" />
             <Skeleton className="h-8 w-16 rounded-xl" />
          </div>
        </div>

        <DashboardGrid>
          <div className="xl:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 rounded-[32px]" />
              ))}
            </div>
          </div>

          <div className="xl:col-span-8">
            <Skeleton className="h-[360px] rounded-[32px]" />
          </div>

          <div className="xl:col-span-4">
            <Skeleton className="h-[360px] rounded-[32px]" />
          </div>

          <div className="xl:col-span-8">
            <Skeleton className="h-[400px] rounded-[32px]" />
          </div>
          <div className="xl:col-span-4">
            <Skeleton className="h-[400px] rounded-[32px]" />
          </div>
        </DashboardGrid>
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
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full h-14 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all transition-transform"
          >
            Emergency Reload
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Console Overview</h1>
          <p className="text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Real-time Analytics & Performance</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          {['Today', '7D', '30D'].map((range) => (
            <Button
              key={range}
              onClick={() => setDateRange(range)}
              variant={dateRange === range ? "default" : "ghost"}
              className={cn(
                "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all h-auto",
                dateRange === range
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <DashboardGrid>
        <div className="xl:col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-2">
            <MetricCard
              title="Revenue"
              value={data.metrics?.[0]?.value ?? 0}
              isCurrency={true}
              change={12.5}
              isPositive={true}
              icon={DollarSign}
              colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
            />
            <MetricCard
              title="Transactions"
              value={data.metrics?.[1]?.value ?? 0}
              change={5.1}
              isPositive={true}
              icon={ShoppingCart}
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
            />
            <MetricCard
              title="Low Stock"
              value={data.metrics?.[2]?.value ?? 0}
              change={0}
              isPositive={true}
              icon={PackageOpen}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            />
            <MetricCard
              title="Refunds"
              value={data.metrics?.[3]?.value ?? 0}
              change={2.1}
              isPositive={false}
              icon={Undo2}
              colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
            />
            <MetricCard
              title="Discounts"
              value={data.metrics?.[4]?.value ?? 0}
              isCurrency={true}
              change={3.2}
              isPositive={true}
              icon={BadgePercent}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Unified Activity Chart */}
        <div className="xl:col-span-8">
          <MonthlyActivityChart
            title="Revenue Performance"
            data={(() => {
              const { startDate, endDate } = calculateDateRange(dateRange);
              const start = new Date(startDate);
              const end = new Date(endDate);
              const points: { label: string; dateStr: string; activity: number }[] = [];

              if (dateRange === 'Today') {
                // Hourly points
                for (let i = 0; i < 24; i++) {
                  const hour = i.toString().padStart(2, '0') + ':00';
                  points.push({ label: hour, dateStr: hour, activity: 0 });
                }
                // Map data (assuming backend gives hourly or we just sum into hours)
                data?.dailySales.forEach(d => {
                    const date = new Date(d.date);
                    const hour = date.getHours();
                    if (points[hour]) points[hour].activity += d.sales;
                });
              } else {
                // Daily points for 7D or 30D
                let curr = new Date(start);
                while (curr <= end) {
                  const dStr = toLocalYMD(curr);
                  points.push({ 
                    label: curr.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                    dateStr: dStr,
                    activity: 0 
                  });
                  curr.setDate(curr.getDate() + 1);
                }

                // Map data
                data?.dailySales.forEach(d => {
                  const match = points.find(p => p.dateStr === d.date);
                  if (match) match.activity += d.sales;
                });
              }

              return points.map(({ label, activity }) => ({ month: label, activity }));
            })()}
            isLoading={dashLoading}
            height={260}
            isCurrency={true}
            unit="PKR"
            subtitle={dateRange === 'Today' ? "Hourly Revenue Flow" : `Daily Performance (${dateRange})`}
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
