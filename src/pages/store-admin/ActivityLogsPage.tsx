import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '@/api/reports.api';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';

const ActivityLogsPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data: logsRes, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['storeadmin-activity-logs', page],
        queryFn: () => getAuditLogs({
            page,
            limit
            // Backend should automatically filter by storeId based on the auth token
        }),
    });

    const logs = logsRes?.data?.data?.logs || logsRes?.data?.logs || [];
    const pagination = logsRes?.data?.data?.pagination || logsRes?.data?.pagination || { totalPages: 1 };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    <span>Store Management</span>
                    <span>/</span>
                    <span className="text-blue-600">Activity Logs</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Operation History</h1>
                <p className="text-slate-500 dark:text-slate-400 font-bold">Track all administrative actions within your store node.</p>
            </div>

            <ActivityLogsTable
                data={logs}
                isLoading={isLoading || isRefetching}
                onRefresh={refetch}
                pagination={{
                    page: page,
                    total: pagination.totalPages,
                    onPageChange: (p) => setPage(p)
                }}
            />
        </div>
    );
};

export default ActivityLogsPage;
