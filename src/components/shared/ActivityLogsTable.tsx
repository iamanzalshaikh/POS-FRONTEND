import React from 'react';
import { 
    RefreshCcw, 
    Download, 
    Filter, 
    Search, 
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Box,
    Activity,
    User
} from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
    id: string;
    createdAt: string;
    action: string;
    entity: string;
    entityId?: string;
    ipAddress?: string;
    user?: {
        name: string;
        email?: string;
        avatar?: string;
    };
    userRole?: string;
    store?: {
        name: string;
    };
    details?: any;
}

interface ActivityLogsTableProps {
    data: ActivityLog[];
    isLoading: boolean;
    onRefresh?: () => void;
    onExport?: () => void;
    pagination: {
        page: number;
        total: number;
        onPageChange: (page: number) => void;
    };
}

const ActivityLogsTable: React.FC<ActivityLogsTableProps> = ({ 
    data, 
    isLoading, 
    onRefresh, 
    onExport,
    pagination 
}) => {
    const getActionStyles = (action: string) => {
        const styles: Record<string, { bg: string, text: string, border: string }> = {
            'FEE_COLLECTED': { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600', border: 'border-blue-100 dark:border-blue-900/50' },
            'EXPENSE_CREATED': { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600', border: 'border-purple-100 dark:border-purple-900/50' },
            'SALARY_PAID': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900/50' },
            'CREATE': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900/50' },
            'UPDATE': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900/50' },
            'DELETE': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600', border: 'border-rose-100 dark:border-rose-900/50' },
            'LOGIN': { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600', border: 'border-indigo-100 dark:border-indigo-900/50' },
        };

        const key = Object.keys(styles).find(k => action.includes(k)) || 'default';
        return styles[key] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' };
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
            {/* Header Area */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Activity Logs</h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        HISTORY - TRACK ACTIONS ACROSS ALL SCHOOLS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] border border-emerald-100 dark:border-emerald-900/50">
                        SYSTEM VERIFIED
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by action..."
                        className="w-full h-10 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onRefresh}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={onExport}
                        className="flex items-center gap-2 px-5 h-10 bg-white dark:bg-slate-900 border border-[#1E1B4B]/20 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1E1B4B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-5 h-10 bg-white dark:bg-slate-900 border border-[#1E1B4B]/20 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1E1B4B] dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm">
                        <Filter size={16} />
                        Columns
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Time</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden md:table-cell">Context</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden lg:table-cell">Initiator</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Action</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 hidden xl:table-cell">Resource</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-6 h-[64px] bg-slate-50/10"></td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center">
                                    <p className="font-inter text-sm font-medium text-slate-400">No activity data found.</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((log) => {
                                const style = getActionStyles(log.action);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-0.5">
                                                    {format(new Date(log.createdAt), 'hh:mm:ss a')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 hidden md:table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                    <Box size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {log.store?.name || 'Main System'}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-0.5">
                                                        {log.entity} Event
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 hidden lg:table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    {log.user?.avatar ? (
                                                        <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                        {log.user?.name || 'System'}
                                                    </span>
                                                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-0.5">
                                                        {log.user?.email || 'automated@system.pos'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[2px] leading-tight ${style.bg} ${style.text} ${style.border}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 hidden xl:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {log.entity} Entity
                                                </span>
                                                <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mt-0.5 font-mono">
                                                    ID: {log.entityId || 'N/A:SYSTEM'}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="p-4 px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Page {pagination.page} of {pagination.total}
                </span>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                        <ChevronLeft size={16} className="text-slate-500" />
                    </button>
                    <button 
                        onClick={() => pagination.onPageChange(Math.min(pagination.total, pagination.page + 1))}
                        disabled={pagination.page >= pagination.total}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                    >
                        <ChevronRight size={16} className="text-slate-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsTable;
