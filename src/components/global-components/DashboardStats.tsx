import React from 'react';
import { Card } from "@/components/ui/Card";
import { Store, CreditCard, CheckCircle, Laptop2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatPKR } from '@/utils/format';

export interface DashboardStatsProps {
  totalStores?: number | string;
  totalRevenue?: number;
  activeStores?: number | string;
  totalDevices?: number | string;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  iconBgColor?: string;
  iconColor?: string;
}> = ({ title, value, icon, iconBgColor = "bg-indigo-50", iconColor = "text-indigo-600" }) => {
  return (
    <Card className="p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {value}
            </h3>
          </div>
        </div>
        <div className={cn("p-4 rounded-[1.25rem] transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm", iconBgColor, iconColor)}>
          {icon}
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className={cn("absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity", iconColor)}>
        <div className="scale-[4] origin-center opacity-20">
          {icon}
        </div>
      </div>
    </Card>
  );
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ totalStores, totalRevenue, activeStores, totalDevices }) => {
  const totalStoresStr = typeof totalStores === 'number' ? totalStores.toLocaleString() : (totalStores || '0');
  const revenueStr = typeof totalRevenue === 'number' ? formatPKR(totalRevenue) : (totalRevenue ? String(totalRevenue) : formatPKR(0));
  const activeStoresStr = typeof activeStores === 'number' ? activeStores.toLocaleString() : (activeStores || '0');
  const totalDevicesStr = typeof totalDevices === 'number' ? totalDevices.toLocaleString() : (totalDevices || '0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <StatCard 
        title="Total Stores" 
        value={String(totalStoresStr)} 
        icon={<Store size={24} />} 
        iconBgColor="bg-indigo-50" 
        iconColor="text-indigo-600" 
      />
      <StatCard 
        title="Total Revenue" 
        value={String(revenueStr)} 
        icon={<CreditCard size={24} />} 
        iconBgColor="bg-emerald-50" 
        iconColor="text-emerald-600" 
      />
      <StatCard 
        title="Active Stores" 
        value={String(activeStoresStr)} 
        icon={<CheckCircle size={24} />} 
        iconBgColor="bg-sky-50" 
        iconColor="text-sky-600" 
      />
      <StatCard 
        title="Total Devices" 
        value={String(totalDevicesStr)} 
        icon={<Laptop2 size={24} />} 
        iconBgColor="bg-violet-50" 
        iconColor="text-violet-600" 
      />
    </div>
  );
};

export default DashboardStats;