import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../../service/api';
import { useStoreStore } from '../../store/useStoreStore';
import { X } from 'lucide-react';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';

const SuperAdminAuditLogs: React.FC = () => {
    // 1. Filter & Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [entity, setEntity] = useState('');
    const [action, setAction] = useState('');
    const [storeId, setStoreId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { stores, fetchStores } = useStoreStore();

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    // 2. Data Fetching
    const { data: logsRes, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['superadmin-audit-logs', page, entity, action, storeId, startDate, endDate],
        queryFn: () => reportsApi.getAuditLogs({
            page,
            limit,
            entity: entity || undefined,
            action: action || undefined,
            storeId: storeId || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined
        }),
    });

    const logs = logsRes?.data?.data?.logs || logsRes?.data?.logs || [];
    const pagination = logsRes?.data?.data?.pagination || logsRes?.data?.pagination || { totalPages: 1 };

    // 3. Helpers
    const resetFilters = () => {
        setEntity('');
        setAction('');
        setStoreId('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Audit Registry</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Cross-network event tracking and security console</p>
                </div>
                <div className="flex items-center gap-3">
                    {(entity || action || storeId || startDate || endDate) && (
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <X size={14} />
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-wrap items-end gap-6 transition-colors duration-300">
                <div className="flex-1 min-w-[180px] space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Domain</label>
                    <select
                        value={entity}
                        onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500/40 outline-none transition-all cursor-pointer"
                    >
                        <option value="">All Domains</option>
                        {['USER', 'STORE', 'PRODUCT', 'DEVICE', 'SALE', 'CATEGORY', 'STOCK'].map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[180px] space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Action</label>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500/40 outline-none transition-all cursor-pointer"
                    >
                        <option value="">All Actions</option>
                        {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'STOCK_ADJUSTMENT'].map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[180px] space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Store Node</label>
                    <select
                        value={storeId}
                        onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500/40 outline-none transition-all cursor-pointer"
                    >
                        <option value="">Global Network</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="flex-[1.5] min-w-[280px] space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date Range</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500/40 outline-none transition-all"
                        />
                        <span className="text-slate-300">—</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500/40 outline-none transition-all"
                        />
                    </div>
                </div>
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

export default SuperAdminAuditLogs;

export default SuperAdminAuditLogs;
