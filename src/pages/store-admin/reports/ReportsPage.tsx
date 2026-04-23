import { useState, useEffect, useMemo } from "react";
import ReportsHeader from "@/components/store-admin/Reports/ReportsHeader";
import StatsCards from "@/components/global-components/StatsCards";
import TopPerformingProducts from "@/components/store-admin/Reports/TopPerformingProducts";
import InventoryReportTables from "@/components/store-admin/Reports/InventoryReportTables";
import MonthlyActivityChart from "@/components/global-components/monthly-activity-chart";
import CategoryPieChart from "../dashboard/components/CategoryPieChart";
import * as reportsApi from "@/api/reports.api";
import { fetchLowStockInventory } from "@/api/inventory.api";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, formatCurrencyShort, formatNumberShort, toLocalYMD } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
    const [dateRangeFilter, setDateRangeFilter] = useState('This Week');

    const [salesReportData, setSalesReportData] = useState<any>(null);
    const [salesLoading, setSalesLoading] = useState(false);
    const [salesError, setSalesError] = useState<string | null>(null);

    const [inventoryReportData, setInventoryReportData] = useState<any>(null);
    const [lowStockItems, setLowStockItems] = useState<any[]>([]);
    const [lowStockTotal, setLowStockTotal] = useState(0);
    const [lowStockPage, setLowStockPage] = useState(1);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState<string | null>(null);

    const calculateDateRange = (range: string) => {
        const end = new Date();
        const start = new Date();
        if (range === 'Today') {
            start.setHours(0, 0, 0, 0);
        } else if (range === 'This Week' || range === '7D') {
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
        } else if (range === 'Month' || range === '30D') {
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
        }
        return {
            startDate: toLocalYMD(start),
            endDate: toLocalYMD(end)
        };
    };

    const loadSalesData = async (params: any) => {
        setSalesLoading(true);
        setSalesError(null);
        try {
            const res = await reportsApi.getStoreDashboardData(params);
            setSalesReportData(res);
        } catch (err: any) {
            console.error("Failed to load sales report:", err);
            setSalesError(err.message || "Failed to load sales report");
        } finally {
            setSalesLoading(false);
        }
    };

    const loadInventoryData = async (page = 1) => {
        setInventoryLoading(true);
        setInventoryError(null);
        try {
            // Stats and Out of Stock come from the general report
            // Low Stock list comes from the paginated endpoint
            const [reportRes, lowStockRes] = await Promise.all([
                reportsApi.getInventoryReport(),
                fetchLowStockInventory({ page, limit: 5 })
            ]);
            
            setInventoryReportData(reportRes);
            setLowStockItems(lowStockRes?.data?.data || []);
            setLowStockTotal(lowStockRes?.data?.total || 0);
            setLowStockPage(page);
        } catch (err: any) {
            console.error("Failed to load inventory report:", err);
            setInventoryError(err.message || "Failed to load inventory report");
        } finally {
            setInventoryLoading(false);
        }
    };

    useEffect(() => {
        const dateParams = calculateDateRange(dateRangeFilter);
        if (activeTab === 'sales') {
            loadSalesData(dateParams);
        } else {
            loadInventoryData(lowStockPage);
        }
    }, [activeTab, dateRangeFilter, lowStockPage]);

    const loading = activeTab === 'sales' ? salesLoading : inventoryLoading;
    const error = activeTab === 'sales' ? salesError : inventoryError;
    const reportRes = activeTab === 'sales' ? salesReportData : inventoryReportData;

    const data = (reportRes as any)?.data || reportRes || null;

    // Process Trend Data (Same logic as Dashboard)
    const trendData = useMemo(() => {
        if (!data?.charts?.revenueByDate) return [];
        const { startDate, endDate } = calculateDateRange(dateRangeFilter);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const points: { label: string; dateStr: string; activity: number }[] = [];

        if (dateRangeFilter === 'Today') {
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                points.push({ label: hour, dateStr: hour, activity: 0 });
            }
            data.charts.revenueByDate.forEach((d: any) => {
                const date = new Date(d.date);
                const hour = date.getHours();
                if (points[hour]) points[hour].activity += d.revenue || 0;
            });
        } else {
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
            data.charts.revenueByDate.forEach((d: any) => {
                const match = points.find(p => p.dateStr === d.date);
                if (match) match.activity += d.revenue || 0;
            });
        }
        return points.map(({ label, activity }) => ({ month: label, activity }));
    }, [data, dateRangeFilter]);

    // Process Category Data
    const categoryData = useMemo(() => {
        if (!data?.charts?.paymentBreakdown) return [];
        const colors = ['#262255', '#24608F', '#508CBB', '#7CB8E7', '#A8D4F3'];
        return data.charts.paymentBreakdown.map((p: any, i: number) => ({
            name: p.paymentMethod || 'Other',
            value: p.revenue || 0,
            color: colors[i % colors.length]
        }));
    }, [data]);

    const salesStats = data ? [
        { name: "Total Revenue", stat: formatCurrencyShort(data.summary?.totalRevenue ?? 0), change: "+14%", changeType: "positive" as const },
        { name: "Transactions", stat: formatNumberShort(data.summary?.totalTransactions ?? 0), change: "+8%", changeType: "positive" as const },
        { name: "GST", stat: formatCurrencyShort(Number(data.summary?.totalTax ?? 0)), change: "+12%", changeType: "positive" as const },
        { name: "Discounts", stat: formatCurrencyShort(data.summary?.totalDiscount ?? 0), change: "+2%", changeType: "positive" as const }
    ] : [];

    const inventoryStats = data ? [
        { name: "Tracked Items", stat: formatNumberShort(data.summary?.totalProducts ?? 0), changeType: "positive" as const },
        { name: "Low Stock", stat: formatNumberShort(data.summary?.lowStockCount ?? 0), changeType: "negative" as const },
        { name: "Out of Stock", stat: formatNumberShort(data.summary?.outOfStockCount ?? 0), changeType: "negative" as const },
        { name: "Total Value", stat: formatCurrencyShort(Number(data.summary?.totalStockValue ?? 0)), changeType: "positive" as const }
    ] : [];

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <ReportsHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                dateRange={dateRangeFilter}
                onDateRangeChange={setDateRangeFilter}
            />

            {loading && !data ? (
                <div className="space-y-10 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-32 rounded-[32px]" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <Skeleton className="h-[400px] rounded-[32px]" />
                        </div>
                        <div className="lg:col-span-4">
                            <Skeleton className="h-[400px] rounded-[32px]" />
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl text-center max-w-lg mx-auto mt-12">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Report Failure</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed px-4">{error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full h-14 bg-[#1E1B4B] text-white rounded-3xl font-black uppercase tracking-widest hover:bg-opacity-90 shadow-xl shadow-indigo-950/20 active:scale-95 transition-all"
                    >
                        Try Again
                    </Button>
                </div>
            ) : activeTab === 'sales' && data ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StatsCards data={salesStats} />
                    
                    {/* Synchronized Analytics Row (Same as Dashboard) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <MonthlyActivityChart
                                title="Revenue Performance"
                                subtitle={dateRangeFilter === 'Today' ? "Hourly Revenue Flow" : `Daily Performance (${dateRangeFilter})`}
                                data={trendData}
                                isLoading={salesLoading}
                                height={320}
                                isCurrency={true}
                                unit="PKR"
                            />
                        </div>
                        <div className="lg:col-span-4">
                            <CategoryPieChart data={categoryData} />
                        </div>
                    </div>

                    {/* Secondary Row for Product Rankings */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-12">
                            <TopPerformingProducts products={data.topProducts || []} />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'inventory' && data ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StatsCards data={inventoryStats} />
                    <InventoryReportTables
                        lowStock={lowStockItems}
                        outOfStock={data.outOfStock ?? []}
                        lowStockPagination={{
                            page: lowStockPage,
                            total: lowStockTotal,
                            onPageChange: setLowStockPage
                        }}
                    />
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase text-xs">
                    No report data available for this criteria.
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
