import React, { useState } from 'react';
import { History, Activity, Filter, Loader2, Calendar, User as UserIcon } from 'lucide-react';
import PageHeader from '../../components/global-components/PageHeader';
import MetricCard from '../../components/global-components/MetricCard';

const AuditLogsPage: React.FC = () => {
  const [isLoading] = useState(false); // Placeholder
  const [logs] = useState<any[]>([]); // Placeholder

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Finance Audit Registry"
        description="Complete historical log of all financial and administrative actions"
        icon={History}
      />

      {/* Metric Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Events"
          value="0"
          icon={Activity}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Active Module"
          value="ALL"
          icon={Filter}
          colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
        />
        <MetricCard
          title="Registry Status"
          value="READY"
          icon={History}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
      </div>

      {/* Placeholder Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 text-center">
            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Loading Logs...</p>
                </div>
            ) : (
                <div className="text-slate-400 italic">
                    Audit log table will be populated once API integration is complete.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
