import { useState } from "react";
import ReportsHeader from "@/components/store-admin/Reports/ReportsHeader";
import StatsCards from "@/components/global-components/StatsCards";
import ReportsCharts from "@/components/store-admin/Reports/ReportsCharts";
import TopPerformingProducts from "@/components/store-admin/Reports/TopPerformingProducts";
import InventoryReportTables from "@/components/store-admin/Reports/InventoryReportTables";
import { useQuery } from "@tanstack/react-query";
import * as reportsApi from "@/api/reports.api";
import { AlertTriangle, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/format";

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
    const [dateRangeFilter, setDateRangeFilter] = useState('This Week');

    const calculateDateRange = (range: string) => {
        const end = new Date();
        const start = new Date();
        if (range === 'Today') {
            start.setHours(0, 0, 0, 0);
        } else if (range === 'This Week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (range === 'Month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        }
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    };

    const dateParams = calculateDateRange(dateRangeFilter);

    // React Query Hooks
    const salesReportQuery = useQuery({
        queryKey: ['reports-dashboard', dateParams],
        queryFn: () => reportsApi.getStoreDashboardData(dateParams),
    });
    const inventoryReportQuery = useQuery({
        queryKey: ['reports-inventory'],
        queryFn: reportsApi.getInventoryReport,
    });

    const loading = activeTab === 'sales' ? salesReportQuery.isLoading : inventoryReportQuery.isLoading;
    const error = activeTab === 'sales' ? (salesReportQuery.error as any)?.message : (inventoryReportQuery.error as any)?.message;
    const reportRes = activeTab === 'sales' ? salesReportQuery.data : inventoryReportQuery.data;

    const data = (reportRes as any)?.data || reportRes || null;

    const salesStats = data ? [
        { name: "Total Revenue", stat: formatCurrency(data.summary?.totalRevenue ?? 0), change: "+14%", changeType: "positive" as const },
        { name: "Transactions", stat: `${data.summary?.totalTransactions ?? 0}`, change: "+8%", changeType: "positive" as const },
        { name: "Avg Ticket", stat: formatCurrency(Math.round(data.summary?.averageTicketSize ?? 0)), change: "+2%", changeType: "positive" as const },
        { name: "Tax Collected", stat: formatCurrency(Number(data.summary?.totalTax ?? 0)), change: "+12%", changeType: "positive" as const },
        { name: "Discounts", stat: formatCurrency(data.summary?.totalDiscount ?? 0), change: "+2%", changeType: "positive" as const }
    ] : [];

    const inventoryStats = data ? [
        { name: "Tracked Items", stat: `${data.summary?.totalProducts ?? 0}`, changeType: "positive" as const },
        { name: "Low Stock", stat: `${data.summary?.lowStockCount ?? 0}`, changeType: "negative" as const },
        { name: "Out of Stock", stat: `${data.summary?.outOfStockCount ?? 0}`, changeType: "negative" as const },
        { name: "Total Value", stat: formatCurrency(Number(data.summary?.totalStockValue ?? 0)), changeType: "positive" as const }
    ] : [];

    return (
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            <ReportsHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                dateRange={dateRangeFilter}
                onDateRangeChange={setDateRangeFilter}
            />

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Compiling Data Stream...</p>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl text-center max-w-lg mx-auto mt-12 animate-in zoom-in-95 duration-500 transition-colors duration-300">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6 border border-rose-100 dark:border-rose-800 shadow-sm">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Report Failure</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed px-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        Try Again
                    </button>
                </div>
            ) : activeTab === 'sales' && data ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StatsCards data={salesStats} />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8">
                            <ReportsCharts charts={data.charts || {}} />
                        </div>
                        <div className="lg:col-span-4">
                            <TopPerformingProducts products={data.topProducts || []} />
                        </div>
                    </div>
                </div>
            ) : activeTab === 'inventory' && data ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <StatsCards data={inventoryStats} />
                    <InventoryReportTables
                        lowStock={data.lowStock ?? []}
                        outOfStock={data.outOfStock ?? []}
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
    );
};

export default ReportsPage;
