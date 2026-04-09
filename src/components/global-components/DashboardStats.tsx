import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Store, CreditCard, CheckCircle, Laptop2 } from 'lucide-react';
import { formatPKR } from '@/utils/format';

export interface DashboardStatsProps {
  totalStores?: number | string;
  totalRevenue?: number;
  activeStores?: number | string;
  totalDevices?: number | string;
}

const StatCard: React.FC<{ title: string; value: string; icon?: React.ReactNode; accent?: string }> = ({ title, value, icon, accent }) => {
  return (
    <Card className="p-4">
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${accent || 'bg-indigo-50'}`}>
              {icon}
            </div>
            <div>
              <dt className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</dt>
              <dd className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{value}</dd>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ totalStores, totalRevenue, activeStores, totalDevices }) => {
  const totalStoresStr = typeof totalStores === 'number' ? totalStores.toLocaleString() : (totalStores || '0');
  const revenueStr = typeof totalRevenue === 'number' ? formatPKR(totalRevenue) : (totalRevenue ? String(totalRevenue) : formatPKR(0));
  const activeStoresStr = typeof activeStores === 'number' ? activeStores.toLocaleString() : (activeStores || '0');
  const totalDevicesStr = typeof totalDevices === 'number' ? totalDevices.toLocaleString() : (totalDevices || '0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Stores" value={String(totalStoresStr)} icon={<Store size={20} className="text-indigo-600" />} accent="bg-indigo-50" />
      <StatCard title="Total Revenue" value={String(revenueStr)} icon={<CreditCard size={20} className="text-emerald-600" />} accent="bg-emerald-50" />
      <StatCard title="Active Stores" value={String(activeStoresStr)} icon={<CheckCircle size={20} className="text-sky-600" />} accent="bg-sky-50" />
      <StatCard title="Total Devices" value={String(totalDevicesStr)} icon={<Laptop2 size={20} className="text-violet-600" />} accent="bg-violet-50" />
    </div>
  );
};

export default DashboardStats;
