import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../service/api';
import { useStoreStore } from '../../store/useStoreStore';
import { X, ShieldCheck, History } from 'lucide-react';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';
import PageHeader from '@/components/global-components/PageHeader';

const SuperAdminAuditLogs: React.FC = () => {
    // 1. Filter & Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [entity, setEntity] = useState('');
    const [action, setAction] = useState('');
    const [storeId, setStoreId] = useState('');
    
    // 2. Constants for Filters
    const entities = ['USER', 'STORE', 'PRODUCT', 'DEVICE', 'SALE', 'CATEGORY', 'STOCK'];
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const { stores, fetchStores } = useStoreStore();

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const [logsRes, setLogsRes] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);

    const fetchLogs = async () => {
        setIsRefetching(true);
        try {
            const res = await reportsApi.getAuditLogs({
                page,
                limit,
                entity: entity || undefined,
                action: action || undefined,
                storeId: storeId || undefined,
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
    }, [page, entity, action, storeId, startDate, endDate]);

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
            <PageHeader
                title="System Activity"
                description="View all system logs and activities"
                icon={ShieldCheck}
            >
                {(entity || action || storeId || startDate || endDate) && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"
                    >
                        <X size={14} />
                        Reset Filters
                    </button>
                )}
            </PageHeader>

            {/* Advanced Filters Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-wrap items-end gap-6 transition-colors duration-300">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Type</label>
                    <select
                        value={entity}
                        onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Types</option>
                        {entities.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Action</label>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Actions</option>
                        {actions.map(a => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Store</label>
                    <select
                        value={storeId}
                        onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Stores</option>
                        {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                onRefresh={fetchLogs}
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
