import { Search, Download, Plus, RotateCw, ShieldCheck } from 'lucide-react';
import type { StaffRole, StaffStatus } from '../../pages/store-admin/staff-management/types/staff.types';

interface StaffFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    roleFilter: StaffRole | 'All';
    onRoleChange: (role: StaffRole | 'All') => void;
    statusFilter: StaffStatus | 'All';
    onStatusChange: (status: StaffStatus | 'All') => void;
    onAddStaff: () => void;
    onExport: () => void;
    onRefresh: () => void;
}

export default function StaffFilters({
    searchQuery,
    onSearchChange,
    roleFilter,
    onRoleChange,
    statusFilter,
    onStatusChange,
    onAddStaff,
    onExport,
    onRefresh,
}: StaffFiltersProps) {
    return (
        <div className="bg-white dark:bg-slate-900 transition-all duration-300">
            {/* Title Section */}
            <div className="px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Staff Members</h1>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] mt-1">
                        History - TRACK ACTIONS ACROSS ALL STORE OPERATIONS
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">System Verified</span>
                </div>
            </div>

            {/* Toolbar Section */}
            <div className="px-8 pb-8 flex flex-col xl:flex-row items-center justify-between gap-6 mt-2">
                <div className="relative w-full xl:w-[400px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, email or ID..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 outline-none transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 flex-1 w-full text-right">
                    <button
                        onClick={onRefresh}
                        className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-600/30 transition-all active:scale-95 shadow-sm group"
                        title="Refresh Data"
                    >
                        <RotateCw className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </button>

                    <button
                        onClick={onExport}
                        className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-600/30 transition-all active:scale-95 shadow-sm group"
                    >
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        Export
                    </button>

                    <button
                        onClick={onAddStaff}
                        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-900 border border-indigo-900/20 rounded-2xl text-white font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-600 shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} />
                        Add Member
                    </button>
                    
                    <div className="mx-2 h-8 w-px bg-slate-200 dark:bg-slate-700 hidden xl:block" />

                    {/* Compact Filter Dropdowns Group */}
                    <div className="flex items-center gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => onRoleChange(e.target.value as StaffRole | 'All')}
                            className="pl-5 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[140px]"
                        >
                            <option value="All">All Roles</option>
                            <option value="STORE_ADMIN">Store Admin</option>
                            <option value="CASHIER">Cashier</option>
                            <option value="ACCOUNTANT">Accountant</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value as StaffStatus | 'All')}
                            className="pl-5 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] outline-none focus:border-indigo-600/30 focus:ring-4 focus:ring-indigo-600/5 transition-all cursor-pointer appearance-none min-w-[140px]"
                        >
                            <option value="All">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
