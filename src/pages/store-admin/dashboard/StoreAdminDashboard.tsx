import { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  DollarSign, 
  ShoppingCart, 
  PackageOpen, 
  Undo2, 
  BadgePercent 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import DashboardGrid from './components/DashboardGrid';
import MonthlyActivityChart from '@/components/global-components/monthly-activity-chart';
import { Button } from '@/components/ui/button';

import CategoryPieChart from './components/CategoryPieChart';
import ActiveDevicesPanel from './components/ActiveDevicesPanel';
import TopProductsTable from './components/TopProductsTable';
import MetricCard from '@/components/global-components/MetricCard';
import { StoreAdminDashboardSkeleton } from '@/components/ui/skeletons/StoreAdminDashboardSkeleton';

import { cn } from '@/lib/utils';
import { toLocalYMD } from '@/utils/format';
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
      startDate: toLocalYMD(start),
      endDate: toLocalYMD(end)
    };
  };

  const { startDate, endDate } = calculateDateRange(dateRange);

  // Queries using TanStack Query
  const { 
    data: dashRes, 
    isLoading: dashLoading, 
    error: dashError 
  } = useQuery({
    queryKey: ['dashboard-summary', dateRange],
    queryFn: () => getDashboardSummary({ startDate, endDate }),
    staleTime: 30000, 
  });

  const { 
    data: devicesRes, 
    isLoading: devicesLoading,
    error: devicesError
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceApi.fetchDevices(),
    staleTime: 30000,
  });

  const loading = dashLoading || devicesLoading;
  const isConnectionError = [dashError, devicesError].some((e: any) => e && !e.response);
  const error = dashError || devicesError 
    ? (isConnectionError ? 'System connection failed. Is the backend running?' : 'Failed to synchronize analytics.') 
    : null;
  const raw = dashRes?.data ?? null;
  const deviceData = devicesRes?.data ?? [];

  // 1. Optimized Dashboard Data Processing
  const data: DashboardView | null = useMemo(() => {
    if (!raw) return null;

    const { summary: s = {}, inventory: inv = {}, charts = {}, topProducts: topProductsRaw = [] } = raw;
    const { revenueByDate: revByDate = [], paymentBreakdown: payBreakdown = [] } = charts;

    const colors = ['#262255', '#24608F', '#508CBB', '#7CB8E7', '#A8D4F3'];
    
    return {
      metrics: [
        { value: s.totalRevenue ?? 0 },
        { value: s.totalTransactions ?? 0 },
        { value: (inv.lowStockCount ?? 0) + (inv.outOfStockCount ?? 0) },
        { value: s.totalRefunds ?? 0 },
        { value: s.totalDiscount ?? 0 },
      ],
      dailySales: revByDate.map((d: { date?: string; revenue?: number }) => ({ 
        date: d.date ?? '', 
        sales: Number(d.revenue ?? 0) 
      })),
      weeklyRevenue: revByDate.map((d: { date?: string; revenue?: number }) => ({ 
        week: d.date ?? '', 
        revenue: Number(d.revenue ?? 0) 
      })),
      categories: payBreakdown.map((p: { paymentMethod?: string; revenue?: number }, i: number) => ({
        name: p.paymentMethod ?? 'Other',
        value: Number(p.revenue ?? 0),
        color: colors[i % colors.length],
      })),
      devices: deviceData.map((d: any) => {
        const lastActive = d.lastActiveAt ? new Date(d.lastActiveAt).getTime() : 0;
        const now = Date.now();
        const isRecent = (now - lastActive) < (5 * 60 * 1000); 
        
        return {
          id: d.id,
          name: d.deviceName || d.name || 'Unknown Device',
          location: d.location || 'Main Floor',
          status: (d.isActive && isRecent) ? 'online' : 'offline',
        };
      }),
      topProducts: topProductsRaw.map((p: any) => {
        const productId = p.productId ?? p.id ?? '';
        // Note: We are no longer fetching the full inventory just for this bar.
        // If the backend doesn't provide stock level in this summary, we show a default health value.
        const stockLevel = p.stockLevel ?? 100; 

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
  }, [raw, deviceData]);

  if (loading && !data) {
    return <StoreAdminDashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-[40px] shadow-xl max-w-md border border-slate-100 dark:border-slate-800">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">System Error</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 font-black tracking-tight text-xs uppercase">{error || 'Failed to establish connection to POS core.'}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full h-14 bg-[#1E1B4B] text-white rounded-3xl font-black uppercase tracking-widest hover:bg-opacity-90 shadow-xl shadow-indigo-950/20 active:scale-95 transition-all transition-transform"
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
                  ? "bg-[#1E1B4B] text-white shadow-lg shadow-indigo-950/20"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      <DashboardGrid>
        <div className="col-span-1 lg:col-span-4 xl:col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-2">
            <MetricCard
              title="Revenue"
              value={data?.metrics?.[0]?.value ?? 0}
              isCurrency={true}
              isPositive={true}
              icon={DollarSign}
              colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
            />
            <MetricCard
              title="Transactions"
              value={data?.metrics?.[1]?.value ?? 0}
              isPositive={true}
              icon={ShoppingCart}
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
            />
            <MetricCard
              title="Low Stock"
              value={data?.metrics?.[2]?.value ?? 0}
              isPositive={true}
              icon={PackageOpen}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
            />
            <MetricCard
              title="Refunds"
              value={data?.metrics?.[3]?.value ?? 0}
              isPositive={false}
              icon={Undo2}
              colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
            />
            <MetricCard
              title="Discounts"
              value={data?.metrics?.[4]?.value ?? 0}
              isCurrency={true}
              isPositive={true}
              icon={BadgePercent}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* Unified Activity Chart */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-8">
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
                // Map data
                data?.dailySales.forEach(d => {
                    let hour: number;
                    if (d.date.includes(':')) {
                        // "14:00" -> 14
                        hour = parseInt(d.date.split(':')[0], 10);
                    } else {
                        const date = new Date(d.date);
                        hour = date.getHours();
                    }
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
            height={280}
            isCurrency={true}
            unit="PKR"
            subtitle={dateRange === 'Today' ? "Hourly Revenue Flow" : `Daily Performance (${dateRange})`}
          />
        </div>

        <div className="col-span-1 lg:col-span-4 xl:col-span-4">
          <CategoryPieChart data={data?.categories ?? []} />
        </div>

        {/* Row 2: Top Selling Inventory & Active Devices */}
        <div className="col-span-1 lg:col-span-4 xl:col-span-8">
          <TopProductsTable products={data?.topProducts ?? []} />
        </div>
        <div className="col-span-1 lg:col-span-4 xl:col-span-4">
          <ActiveDevicesPanel devices={data?.devices ?? []} />
        </div>
      </DashboardGrid>

    </div>
  );
}
