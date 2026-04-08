import React, { useState, useEffect } from 'react';
import { Store, CreditCard, Laptop2, Activity, CalendarDays, Download, Loader2, AlertCircle } from 'lucide-react';
import { reportsApi } from '../../service/api';
import { StatsCard } from '../../components/ui/StatsCard';
import { DataTable } from '@/components/global-components/data-table';
import { formatPKR } from '@/utils/format';

const SuperOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await reportsApi.getSuperAdminOverview();
        if (res.data.success) {
          setStats(res.data.data);
        } else {
          setError(res.data.message || 'Failed to load stats');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error occurred while fetching stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading global dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-500 font-medium">{error}</p>
      </div>
    );
  }

  const maxRevenue = stats?.revenueByStore?.length ? Math.max(...stats.revenueByStore.map((s: any) => s.revenue)) : 1;

  const recentDeviceColumns = [
    {
      accessorKey: 'storeId',
      header: 'Store ID',
      cell: ({ getValue }) => <span className="font-bold text-slate-700">STR-{getValue<string>()?.slice(-4)?.toUpperCase()}</span>,
    },
    {
      accessorKey: 'deviceType',
      header: 'Device Type',
      cell: ({ getValue }) => <span className="text-slate-500 font-medium">{getValue<string>() || 'Terminal'}</span>,
    },
    {
      accessorKey: 'store.city',
      id: 'region',
      header: 'Region',
      cell: ({ row }) => <span className="text-slate-500 font-medium truncate max-w-[150px]">{row.original.store?.city || 'Unknown'}, {row.original.store?.state || ''}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const active = getValue<boolean>();
        return (
          <span className={`px-3 py-1 rounded-md text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ getValue }) => <span className="text-slate-400 font-medium text-xs">{new Date(getValue<string>()).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative z-0">
      
      {/* Header Section */}
      <div className="flex justify-between items-end mb-8 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Super Admin Overview</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance metrics across 12 countries</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>Last 30 Days</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-[#1f1e35] text-white rounded-lg text-sm font-bold hover:bg-[#2a2845] transition-colors shadow-md">
            <Download className="w-4 h-4 text-indigo-300" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Stores"
          value={stats?.totalStores?.toLocaleString() || '0'}
          icon={Store}
          iconColorClass="text-indigo-600"
          iconBgClass="bg-indigo-50"
          description="total"
          trend={{ value: "Live DB", isPositive: true, label: "Live DB total" }}
        />
        <StatsCard 
          title="Total Revenue"
          value={formatPKR(stats?.totalRevenue || 0)}
          icon={CreditCard}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50"
          description="total revenue"
          trend={{ value: "Lifetime", isPositive: true, label: "Lifetime total revenue" }}
        />
        <StatsCard 
          title="Active Devices"
          value={stats?.activeDevices?.toLocaleString() || '0'}
          icon={Laptop2}
          iconColorClass="text-blue-600"
          iconBgClass="bg-blue-50"
          description="registered devices"
          trend={{ value: "Active", isPositive: true, label: "Active registered devices" }}
        />
        <StatsCard 
          title="Active Trials"
          value={stats?.activeTrials?.toLocaleString() || '0'}
          icon={Activity}
          iconColorClass="text-rose-600"
          iconBgClass="bg-rose-50"
          description="in progress"
          trend={{ value: "Trials", isPositive: false, label: "Trials in progress" }}
        />
      </div>

      {/* Middle Grid (Revenue Chart & Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart Area */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Revenue by Top Stores</h2>
              <p className="text-slate-500 font-medium text-sm mt-1">Top performing branches globally</p>
            </div>
            <button className="text-sm font-bold text-slate-900 px-3 py-1">View All</button>
          </div>
          
          <div className="mb-4">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {formatPKR(stats?.totalRevenue || 0)}
            </div>
            <div className="text-xs font-bold text-slate-400 flex items-center mt-2">
              <span className="text-slate-500">Total Lifetime Revenue</span>
            </div>
          </div>

          <div className="flex-1 min-h-[160px] flex items-end justify-between px-2 pt-10 pb-4">
            {stats?.revenueByStore?.length > 0 ? (
              stats.revenueByStore.map((store: any, idx: number) => {
                const heightPercentage = Math.max((store.revenue / maxRevenue) * 100, 5);
                const isTop = idx === 0;
                return (
                  <div key={store.storeId} className="flex flex-col items-center space-y-3 w-1/6 group cursor-pointer" title={formatPKR(store.revenue)}>
                    <div 
                      className={`w-full ${isTop ? 'bg-slate-900' : 'bg-slate-100 group-hover:bg-indigo-50'} rounded-t-sm relative transition-all`}
                      style={{ height: `${Math.min(heightPercentage, 100)}%`, minHeight: '30px' }}
                    ></div>
                    <span className={`text-[10px] font-bold ${isTop ? 'text-slate-900' : 'text-slate-500'} truncate w-full text-center px-1 uppercase`}>
                      {store.city?.substring(0, 3) || store.storeName.substring(0, 3)}
                    </span>
                  </div>
                );
              })
            ) : (
               <div className="w-full text-center text-slate-400 text-sm italic py-10">No revenue data available yet.</div>
            )}
          </div>
        </div>

        {/* Store Density Map Area */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Store Density</h2>
          <p className="text-slate-500 font-medium text-sm mt-1 mb-6">Geographical distribution</p>
          
          <div className="w-full h-48 bg-slate-200 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
             {/* Map Placeholder */}
             <div className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] top-[40%] left-[30%]"></div>
             <div className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] top-[60%] left-[50%]"></div>
             <div className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] top-[70%] left-[75%]"></div>
             <span className="text-slate-400 font-mono text-sm tracking-widest hidden">MAP DATA</span>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-end">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                <span className="font-bold text-slate-700">North America</span>
              </div>
              <span className="font-extrabold text-slate-900">42%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-[42%]"></div>
            </div>

            <div className="flex items-center justify-between text-sm pt-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                <span className="font-bold text-slate-700">Europe</span>
              </div>
              <span className="font-extrabold text-slate-900">28%</span>
            </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400 w-[28%]"></div>
            </div>

             <div className="flex items-center justify-between text-sm pt-2">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                <span className="font-bold text-slate-700">Asia Pacific</span>
              </div>
              <span className="font-extrabold text-slate-900">30%</span>
            </div>
             <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-300 w-[30%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Device Provisioning Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Device Provisioning</h2>
          <button className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">See activity log</button>
        </div>
        <DataTable
          data={stats?.recentDevices || []}
          columns={recentDeviceColumns}
          showToolbar={false}
          showExport={false}
          showColumns={false}
        />
      </div>

    </div>
  );
};

export default SuperOverview;