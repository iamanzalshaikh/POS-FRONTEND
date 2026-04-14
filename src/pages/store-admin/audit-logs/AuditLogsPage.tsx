import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '@/api/reports.api';
import { X, Search, Filter, History, Box, Activity } from 'lucide-react';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';
import { cn } from '@/lib/utils';

const AuditLogsPage: React.FC = () => {
    // 1. Filter & Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [entity, setEntity] = useState('');
    const [action, setAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [logsRes, setLogsRes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    const fetchLogs = async () => {
        setIsRefetching(true);
        try {
            const res = await getAuditLogs({
                page,
                limit,
                entity: entity || undefined,
                action: action || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setLogsRes(res);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setIsLoading(false);
            setIsRefetching(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, entity, action, startDate, endDate]);

    const logs = logsRes?.data?.logs || [];
    const totalPages = logsRes?.data?.pagination?.totalPages || 1;

    // 3. Helpers
    const resetFilters = () => {
        setEntity('');
        setAction('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Registry</h1>
                    <p className="text-slate-500 dark:text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Real-time event tracking and security history</p>
                </div>
                <div className="flex items-center gap-3">
                    {(entity || action || startDate || endDate) && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95 shadow-sm"
                        >
                            <X size={14} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters Card */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-6 transition-all duration-300">
                <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <Box size={12} className="text-indigo-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Business Domain</label>
                    </div>
                    <select
                        value={entity}
                        onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">All Domains</option>
                        {['USER', 'PRODUCT', 'DEVICE', 'SALE', 'CATEGORY', 'STOCK', 'SUPPLIER', 'PURCHASE'].map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <Activity size={12} className="text-indigo-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Event Action</label>
                    </div>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">All Actions</option>
                        {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STOCK_ADJUSTMENT'].map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>

                <div className="flex-[1.5] min-w-[320px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <History size={12} className="text-indigo-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Timeline Range</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all shadow-sm"
                        />
                        <span className="text-slate-300 dark:text-slate-700 font-black">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="flex-1 px-5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <ActivityLogsTable
                    data={logs}
                    isLoading={isLoading}
                    onRefresh={fetchLogs}
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

export default AuditLogsPage;
