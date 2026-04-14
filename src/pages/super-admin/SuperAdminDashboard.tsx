import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from '../../service/api';
import {
    RefreshCcw,
    AlertTriangle
} from 'lucide-react';
import MonthlyActivityChart from '@/components/global-components/monthly-activity-chart';
import ChartBarStacked from '@/components/global-components/ChartBarStacked';
import DashboardStats from '@/components/global-components/DashboardStats';
import { DataTable } from '@/components/global-components/data-table';
import { storesApi } from '../../service/api';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';
import { type ChartConfig } from "@/components/ui/chart";
import { formatPKR, formatNumberShort, formatCurrencyShort } from '@/utils/format';

const subscriptionConfig = {
    basic: {
        label: "Basic",
        color: "#6366f1",
    },
    professional: {
        label: "Professional",
        color: "#10b981",
    },
    enterprise: {
        label: "Enterprise",
        color: "#f59e0b",
    },
} satisfies ChartConfig;

const SuperAdminDashboard: React.FC = () => {
    const [overviewRes, setOverviewRes] = useState<any>(null);
    const [isOverviewLoading, setIsOverviewLoading] = useState(true);
    const [isOverviewError, setIsOverviewError] = useState(false);
    const [isOverviewRefetching, setIsOverviewRefetching] = useState(false);

    const [storesRes, setStoresRes] = useState<any>(null);
    const [isStoresLoading, setIsStoresLoading] = useState(true);

    const refetchOverview = async () => {
        setIsOverviewRefetching(true);
        setIsOverviewError(false);
        try {
            const res = await reportsApi.getSuperAdminOverview();
            setOverviewRes(res);
        } catch (error) {
            console.error("Failed to fetch overview:", error);
            setIsOverviewError(true);
        } finally {
            setIsOverviewLoading(false);
            setIsOverviewRefetching(false);
        }
    };

    const loadStores = async () => {
        setIsStoresLoading(true);
        try {
            const res = await storesApi.getAll();
            setStoresRes(res);
        } catch (error) {
            console.error("Failed to fetch stores:", error);
        } finally {
            setIsStoresLoading(false);
        }
    };

    useEffect(() => {
        refetchOverview();
        loadStores();

        // Automatic Global Sync (2 minutes)
        // Refreshes all infrastructure telemetry and node data
        const syncInterval = setInterval(() => {
            refetchOverview();
            loadStores();
        }, 120000);

        const healthInterval = setInterval(() => {
            reportsApi.getHealth().catch(() => {});
        }, 60000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(healthInterval);
        };
    }, []);

    const statsRaw = overviewRes?.data?.data || overviewRes?.data || {};

    // Aggregate monthly store growth data
    const monthlyGrowthData = React.useMemo(() => {
        if (!storesRes?.data?.data) return [];

        const stores = storesRes.data.data;
        const last12Months = Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(startOfMonth(new Date()), 11 - i);
            return {
                month: format(date, 'MMM'),
                fullDate: date,
                activity: 0
            };
        });

        stores.forEach((store: any) => {
            if (!store.createdAt) return;
            const createdDate = parseISO(store.createdAt);

            last12Months.forEach(m => {
                if (format(createdDate, 'MMM yyyy') === format(m.fullDate, 'MMM yyyy')) {
                    m.activity += 1;
                }
            });
        });

        return last12Months.map(({ month, activity }) => ({ month, activity }));
    }, [storesRes]);

    // Generate subscription data for both chart and table
    const subscriptionData = React.useMemo(() => {
        return Array.from({ length: 6 }, (_, i) => {
            const date = subMonths(startOfMonth(new Date()), 5 - i);
            return {
                month: format(date, 'MMMM'),
                basic: Math.floor(Math.random() * 50) + 20,
                professional: Math.floor(Math.random() * 40) + 30,
                enterprise: Math.floor(Math.random() * 20) + 10,
            };
        });
    }, []);

    const latestSubscriptionStats = subscriptionData[subscriptionData.length - 1];
    const subscriptionTableRows = [
        { name: 'Basic', count: latestSubscriptionStats.basic, price: 2900, color: subscriptionConfig.basic.color },
        { name: 'Professional', count: latestSubscriptionStats.professional, price: 7900, color: subscriptionConfig.professional.color },
        { name: 'Enterprise', count: latestSubscriptionStats.enterprise, price: 19900, color: subscriptionConfig.enterprise.color },
    ];

    const activeStoresCount = React.useMemo(() => {
        if (!storesRes?.data?.data) return 0;
        return storesRes.data.data.filter((s: any) => s.isActive).length;
    }, [storesRes]);

    const recentStores = React.useMemo(() => {
        if (!storesRes?.data?.data) return [];
        return [...storesRes.data.data]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [storesRes]);

    const tableColumns = [
        {
            accessorKey: "name",
            header: "Node Identity",
            cell: ({ row }: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-white leading-tight">{row.original.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">ID: {row.original.id.slice(-8)}</span>
                </div>
            )
        },
        {
            accessorKey: "ownerName",
            header: "Governance",
            cell: ({ row }: any) => <span className="text-sm text-slate-500 font-medium">{row.original.ownerName || 'Unassigned'}</span>
        },
        {
            accessorKey: "category",
            header: "Sector",
            cell: ({ row }: any) => (
                <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-[10px] rounded-lg px-3 py-1">
                    {(row.original.category || 'GEN').toUpperCase()}
                </span>
            )
        },
        {
            accessorKey: "isActive",
            header: "Status",
            cell: ({ row }: any) => (
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex ${row.original.isActive ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-300'}`}>
                    {row.original.isActive ? 'Active' : 'Inactive'}
                </div>
            )
        }
    ];

    const handleRefetch = () => {
        refetchOverview();
    };

    if (isOverviewLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 animate-pulse">
                <div className="w-16 h-16 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="mt-6 text-slate-400 font-black text-[10px] uppercase tracking-[4px]">Synchronizing Neural Network...</p>
            </div>
        );
    }

    if (isOverviewError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-rose-50 rounded-[3rem] border border-rose-100 text-rose-600 text-center space-y-4">
                <AlertTriangle size={48} />
                <h3 className="text-xl font-black uppercase tracking-tight">Telemetry Retrieval Offline</h3>
                <p className="text-sm font-bold opacity-70">Failed to establish connection with global data centers.</p>
                <button
                    onClick={() => handleRefetch()}
                    className="px-8 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:bg-rose-700 transition-all active:scale-95"
                >
                    Retry Protocol
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Infrastructure Overview</h1>
                    <p className="text-slate-500 font-medium uppercase tracking-widest text-[11px] mt-1">Global SaaS Network Status & Performance</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleRefetch()}
                        disabled={isOverviewRefetching}
                        className="group flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:border-indigo-200 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCcw size={14} className={`${isOverviewRefetching ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform`} />
                        Refetch Data
                    </button>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="w-full">
                <DashboardStats 
                    totalStores={formatNumberShort(statsRaw.totalStores || 0)}
                    totalRevenue={formatCurrencyShort(statsRaw.totalRevenue || 0)}
                    activeStores={formatNumberShort(activeStoresCount)}
                    totalDevices={formatNumberShort(statsRaw.activeDevices || 0)} 
                />
            </div>

            {/* Side-by-Side Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <MonthlyActivityChart
                    data={monthlyGrowthData}
                    isLoading={isStoresLoading}
                    title="Network Growth"
                    subtitle="New store nodes provisioned (Last 12mo)"
                    height={300}
                    className="h-full"
                />

                <ChartBarStacked
                    title="Subscription Distribution"
                    subtitle="Active plans by tier (Last 6mo)"
                    data={subscriptionData}
                    config={subscriptionConfig}
                    height={300}
                    className="h-full"
                />
            </div>

            {/* Subscription Distribution Table */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm dark:bg-slate-900 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Revenue Breakdown</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Billing Cycle Metrics</p>
                    </div>
                </div>

                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Plan Tier</th>
                                <th className="px-6 py-4 text-right">Price</th>
                                <th className="px-6 py-4 text-right">Active</th>
                                <th className="px-6 py-4 text-right">MRR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {subscriptionTableRows.map((row) => (
                                <tr key={row.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 border-none flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: row.color }} />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.name}</span>
                                    </td>
                                    <td className="px-6 py-4 border-none text-right font-medium text-slate-500 text-sm">{formatCurrencyShort(row.price)}</td>
                                    <td className="px-6 py-4 border-none text-right font-bold text-slate-900 dark:text-slate-100 text-sm">{formatNumberShort(row.count)}</td>
                                    <td className="px-6 py-4 border-none text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrencyShort(row.count * row.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                <td colSpan={3} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Projected Revenue</td>
                                <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white text-base">
                                    {formatCurrencyShort(subscriptionTableRows.reduce((acc, row) => acc + (row.count * row.price), 0))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>


            {/* Recent Infrastructure Nodes Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Infrastructure Nodes Registry</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time status of recently provisioned network branches</p>
                    </div>
                </div>
                <div className="p-4">
                    <DataTable
                        data={recentStores}
                        columns={tableColumns}
                        isLoading={isStoresLoading}
                        showToolbar={false}
                        showExport={false}
                        showColumns={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
