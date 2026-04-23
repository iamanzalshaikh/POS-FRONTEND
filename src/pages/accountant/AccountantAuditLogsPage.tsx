import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getFinanceAuditLogs } from '@/api/reports.api';
import { X, Search, History, Wallet, Activity, ShieldCheck, CreditCard, Receipt, FileText } from 'lucide-react';
import ActivityLogsTable from '@/components/shared/ActivityLogsTable';
import { Button } from '@/components/ui/button';
import MetricCard from '@/components/global-components/MetricCard';
import { useDebounce } from '@/hooks';
import { exportToExcel } from '@/utils/excel-export';

const ACTION_OPTIONS = [
    { label: 'Expense Created', value: 'EXPENSE_CREATED' },
    { label: 'Salary Paid', value: 'SALARY_PAID' },
    { label: 'Supplier Payment', value: 'SUPPLIER_PAYMENT' },
    { label: 'Tax Updated', value: 'TAX_UPDATED' },
];

const AccountantAuditLogsPage: React.FC = () => {
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
        queryKey: ['finance-audit-logs', page, action, debouncedSearch],
        queryFn: () => getFinanceAuditLogs({
            page,
            limit,
            action: action || undefined,
            search: debouncedSearch || undefined
        }),
        staleTime: 1000 * 60 * 5, // 5 minutes for finance logs
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
        
        const rows = logs.map((log: any) => ({
            'Log Timestamp': new Date(log.createdAt).toLocaleString(),
            'Security Action': log.action,
            'System Module': log.module,
            'Resource Identifier': log.entityId || 'N/A',
            'Change Detail': JSON.stringify(log.newValue || log.details || {})
        }));
        
        exportToExcel(rows, `Financial-Audit-Logs-${new Date().toISOString().split('T')[0]}`, 'Audit Trail');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-indigo-500" size={32} />
                        Financial Audit Log
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">
                        Monitor financial transactions, payroll releases, and expense records
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-4 mr-4 px-6 py-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <ShieldCheck className="text-indigo-600" size={20} />
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Integrity Status</p>
                            <p className="text-sm font-bold text-indigo-900 mt-1">Verified Financial Trace</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Regular Expenses"
                    value={logs.filter((l: any) => l.action.includes('EXPENSE')).length}
                    icon={Receipt}
                    colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                />
                <MetricCard 
                    title="Payrolls Processed"
                    value={logs.filter((l: any) => l.action === 'SALARY_PAID').length}
                    icon={Wallet}
                    colorClass="bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                />
                <MetricCard 
                    title="Supplier Payments"
                    value={logs.filter((l: any) => l.action === 'SUPPLIER_PAYMENT').length}
                    icon={CreditCard}
                    colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                />
                <MetricCard 
                    title="Total Activities"
                    value={logsRes?.data?.pagination?.total || 0}
                    icon={Activity}
                    colorClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                />
            </div>

            {/* Advanced Filters Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap items-end gap-6">
                <div className="flex-1 min-w-[200px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <FileText size={12} className="text-indigo-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Action Category</label>
                    </div>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1); }}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all cursor-pointer appearance-none shadow-sm"
                    >
                        <option value="">All Financial Actions</option>
                        {ACTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>

                <div className="flex-[2] min-w-[300px] space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                        <Search size={12} className="text-indigo-500" />
                        <label className="text-[10px] font-black text-slate-400/80 uppercase tracking-widest">Resource ID / Note Search</label>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by ID, Category, or Amount..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 outline-none transition-all shadow-sm shadow-indigo-500/[0.02]"
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

export default AccountantAuditLogsPage;
