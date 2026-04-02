import React from 'react';
import { 
    RefreshCcw, 
    Download, 
    Filter, 
    Search, 
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    School,
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
        const styles: Record<string, { bg: string, text: string }> = {
            'FEE_COLLECTED': { bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
            'EXPENSE_CREATED': { bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
            'SALARY_PAID': { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]' },
            'CREATE': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600' },
            'UPDATE': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600' },
            'DELETE': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600' },
            'LOGIN': { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600' },
        };

        const key = Object.keys(styles).find(k => action.includes(k)) || 'default';
        return styles[key] || { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' };
    };

    return (
        <div className="bg-white dark:bg-[#111827] rounded-[12px] p-5 border border-[#E5E7EB] dark:border-[#1F2937] transition-colors duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-[18px] font-semibold text-[#111827] dark:text-[#F9FAFB]">Activity Logs</h2>
                    <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-[0.08em] mt-0.5">
                        HISTORY - TRACK ACTIONS ACROSS ALL SCHOOLS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-[#DCFCE7] dark:bg-[#064E3B] text-[#166534] dark:text-[#6EE7B7] px-2.5 py-1 rounded-full text-[11px] font-bold">
                        SYSTEM VERIFIED
                    </span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search by action..."
                        className="w-full h-[40px] pl-10 pr-4 bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-lg text-sm outline-none focus:border-blue-500 transition-all dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onRefresh}
                        className="w-9 h-9 flex items-center justify-center border border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-all"
                    >
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={onExport}
                        className="flex items-center gap-2 px-4 h-9 border border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-all"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 h-9 border border-[#E5E7EB] dark:border-[#374151] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 transition-all">
                        <Filter size={16} />
                        Columns
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-y-[1.5px] border-slate-950 dark:border-white">
                            <th className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase">Time</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase hidden md:table-cell">Context</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase hidden lg:table-cell">Initiator</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase">Action</th>
                            <th className="px-6 py-5 text-[11px] font-black text-slate-900 dark:text-white tracking-[0.1em] uppercase hidden xl:table-cell">Resource</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-950 dark:divide-white/10">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-6 h-[64px] bg-slate-50/10"></td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium font-jakarta">No activity data found.</td>
                            </tr>
                        ) : (
                            data.slice(0, 5).map((log) => {
                                const style = getActionStyles(log.action);
                                return (
                                    <tr key={log.id} className="h-[64px] hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white capitalize">
                                                    {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                    {format(new Date(log.createdAt), 'hh:mm:ss a')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                    <School size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">
                                                        {log.store?.name || 'System Network'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                        {log.entity} Event
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    {log.user?.avatar ? (
                                                        <img src={log.user.avatar} alt={log.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={14} className="text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                                        {log.user?.name || 'System'}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                                        {log.user?.email || 'automated@system.pos'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden xl:table-cell">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#111827] dark:text-white">
                                                    {log.entity} Entity
                                                </span>
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tracking-tighter">
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
            <div className="mt-5 flex items-center justify-end gap-3 px-1">
                <span className="text-[11px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">
                    Page {pagination.page} of {pagination.total}
                </span>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="padding-[2px] w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#374151] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        <ChevronLeft size={16} className="text-slate-500" />
                    </button>
                    <button 
                        onClick={() => pagination.onPageChange(Math.min(pagination.total, pagination.page + 1))}
                        disabled={pagination.page >= pagination.total}
                        className="padding-[2px] w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#374151] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        <ChevronRight size={16} className="text-slate-500" />
                    </button>
                    <button className="padding-[2px] w-8 h-8 flex items-center justify-center rounded-lg border border-[#E5E7EB] dark:border-[#374151] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ml-1 cursor-pointer">
                        <MoreHorizontal size={16} className="text-slate-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsTable;
