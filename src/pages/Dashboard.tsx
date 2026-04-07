import React, { useState, useEffect } from 'react';
import GlobalPieChart from '@/components/global-components/PieChart';
import StatsCards from "@/components/global-components/StatsCards";
import {
    CalendarDays,
    Download,
    Monitor,
    MoreVertical,
    Search,
    Filter
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getSuperAdminOverview } from '@/api/dashboard.api';

export default function Dashboard() {
    const [dashboardRes, setDashboardRes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const res = await getSuperAdminOverview();
            setDashboardRes(res);
        } catch (error) {
            console.error("Failed to fetch dashboard overview:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const statsRaw = dashboardRes?.data || dashboardRes;
    const stats = statsRaw;

    // Map existing revenue data to recharts format
    const revenueData = stats?.revenueByStore?.map((s: any) => ({
        name: s.storeName,
        revenue: s.revenue
    })) || [];

    const densityData = [
        { name: 'North America', value: 42, color: '#4f46e5' },
        { name: 'Europe', value: 28, color: '#818cf8' },
        { name: 'Asia Pacific', value: 30, color: '#c7d2fe' },
    ];

    const statsData = [
        { name: "Total Stores", stat: stats?.totalStores?.toLocaleString() || "0", change: "+12.5%", changeType: "positive" as const },
        { name: "Total Revenue", stat: `₨ ${stats?.totalRevenue?.toLocaleString() || "0"}`, change: "+8.2%", changeType: "positive" as const },
        { name: "Active Devices", stat: stats?.activeDevices?.toLocaleString() || "0", change: "+4.1%", changeType: "positive" as const },
        { name: "Active Trials", stat: stats?.activeTrials?.toLocaleString() || "0", change: "-2.4%", changeType: "negative" as const },
    ];

    return (
        <div className="p-8 space-y-8 min-h-screen bg-slate-50/50">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Super Admin Overview</h1>
                    <p className="text-slate-500 font-medium">Real-time performance metrics across 12 countries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                        <CalendarDays size={18} className="text-slate-400" />
                        Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#1a192b] text-white rounded-xl text-sm font-bold hover:bg-[#2a2940] transition-all shadow-lg">
                        <Download size={18} className="text-indigo-300" />
                        Export Report
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
                    <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-400 font-black text-[10px] uppercase tracking-[4px] animate-pulse">Summoning Metrics...</p>
                </div>
            ) : (
                <>
                    <StatsCards data={statsData} />

                    {/* Second Row: Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Revenue Chart */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">Revenue by Top Stores</h3>
                                    <p className="text-sm text-slate-500 font-medium">Top performing branches globally</p>
                                </div>
                                <button className="text-black hover:text-slate-600 group">
                                    <MoreVertical size={24} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontWeight: 800, color: '#1a192b' }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="#4f46e5"
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Right: Store Density */}
                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">Store Density</h3>
                                    <p className="text-sm text-slate-500 font-medium">Geographical distribution</p>
                                </div>
                            </div>
                            <GlobalPieChart
                                noWrapper
                                data={densityData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                outerRadius={80}
                            />
                        </div>
                    </div>

                    {/* Third Row: Recent Device Provisioning table */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
                        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">Recent Device Provisioning</h3>
                                <p className="text-sm text-slate-500 font-medium">Hardware rollouts in progress</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search stores..."
                                        className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400 w-full sm:w-64"
                                    />
                                </div>
                                <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600">
                                    <Filter size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-4">Store ID</th>
                                        <th className="px-8 py-4">Device Type</th>
                                        <th className="px-8 py-4">Region</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats?.recentDevices?.map((device: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-8 py-5">
                                                <span className="font-mono font-bold text-slate-900 text-sm">STR-{device.storeId?.substring(device.storeId.length - 4).toUpperCase()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <Monitor size={16} className="text-slate-400" />
                                                    <span className="font-bold text-slate-700 text-sm">{device.deviceName || device.deviceType || 'Terminal v4'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 font-medium text-slate-500 text-sm">
                                                {device.store?.city || 'Unknown'}, {device.store?.state || 'Global'}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${device.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    }`}>
                                                    {device.isActive ? 'Active' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 font-bold text-slate-400 text-sm italic">
                                                {new Date(device.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {!stats?.recentDevices?.length && (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic font-medium">
                                                No recent device updates found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
