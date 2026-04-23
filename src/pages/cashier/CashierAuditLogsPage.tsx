import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCashierAuditLogs } from '@/api/reports.api';
import { X, Search, History, Box, Activity, ShieldCheck, ShoppingBag, RotateCw, PackageCheck } from 'lucide-react';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';
import { Button } from '@/components/ui/button';
import MetricCard from '@/components/global-components/MetricCard';
import { useDebounce } from '@/hooks';

const ACTION_OPTIONS = [
    { label: 'Create Sale', value: 'CREATE_SALE' },
    { label: 'Refund Invoice', value: 'REFUND_INVOICE' },
    { label: 'Stock Returned', value: 'STOCK_RETURNED' },
    { label: 'Cancel Sale', value: 'CANCEL_SALE' },
];

const CashierAuditLogsPage: React.FC = () => {
    // 1. Filter & Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [action, setAction] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Query
    const { 
        data: logsRes, 
        isLoading, 
        refetch 
    } = useQuery({
        queryKey: ['cashier-audit-logs', page, action, debouncedSearch],
        queryFn: () => getCashierAuditLogs({
            page,
            limit,
            action: action || undefined,
            search: debouncedSearch || undefined
        }),
        staleTime: 1000 * 60 * 2, // 2 minutes for cashier logs
    });

    const logs = logsRes?.data?.logs || [];
    const totalPages = logsRes?.data?.pagination?.totalPages || 1;

    // 3. Helpers
    const resetFilters = () => {
        setAction('');
        setSearchQuery('');
        setPage(1);
    };

    const handleExport = () => {
        if (!logs.length) return;
        const headers = ["Time", "Action", "Module", "Resource ID", "Value Updated"];
        const rows = logs.map((log: any) => [
            new Date(log.createdAt).toLocaleString(),
            log.action,
            log.module,
            log.entityId || 'N/A',
            JSON.stringify(log.newValue || {})
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map((e: any) => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cashier_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-emerald-500" size={32} />
                        Personal Audit Log
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">
                        Track your daily operations and secure transaction history
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-4 mr-4 px-6 py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <ShieldCheck className="text-emerald-600" size={20} />
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Security Status</p>
                            <p className="text-sm font-bold text-emerald-900 mt-1">Authenticated Trace</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Recent Sales"
                    value={logs.filter((l: any) => l.action === 'CREATE_SALE').length}
                    icon={ShoppingBag}
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                />
                <MetricCard 
                    title="Refunds Issued"
                    value={logs.filter((l: any) => l.action === 'REFUND_INVOICE').length}
                    icon={RotateCw}
                    colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                />
                <MetricCard 
                    title="Stock Restores"
                    value={logs.filter((l: any) => l.action === 'STOCK_RETURNED').length}
                    icon={PackageCheck}
                    colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                />
                <MetricCard 
                    title="Total Events"
                    value={logsRes?.data?.pagination?.total || 0}
                    icon={Activity}
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                />
            </div>

            {/* Advanced Filters Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-end gap-6">
                <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <Activity size={12} className="text-emerald-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Filter by Action</label>
                    </div>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">All Operational Actions</option>
                        {ACTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>

                <div className="flex-[2] min-w-[300px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <Search size={12} className="text-emerald-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Quick Search</label>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by invoice # or product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all shadow-sm shadow-emerald-500/[0.02]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {(action || searchQuery) && (
                        <Button
                            variant="secondary"
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-6 h-12 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
                        >
                            <X size={14} />
                            Reset
                        </Button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <ActivityLogsTable
                    data={logs}
                    isLoading={isLoading}
                    onRefresh={() => refetch()}
                    onExport={handleExport}
                    searchValue={searchQuery}
                    onSearch={(val) => setSearchQuery(val)}
                    pagination={{
                        page: page,
                        total: totalPages,
                        onPageChange: (p) => setPage(p)
                    }}
                />
            </div>
        </div>
    );
};

export default CashierAuditLogsPage;
