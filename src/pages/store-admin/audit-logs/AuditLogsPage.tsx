import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import { getAuditLogs } from '@/api/reports.api';
import { FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';

type AuditLog = {
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    ipAddress?: string | null;
    user?: { name?: string; email?: string } | null;
};

export default function AuditLogsPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState<'ALL' | 'LOGIN' | 'LOGOUT'>('ALL');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAuditLogs({ limit: 100 })
            .then((res) => {
                if (cancelled) return;
                const payload = res.data as { data?: { logs?: AuditLog[] } };
                setLogs(payload?.data?.logs ?? []);
            })
            .catch(() => {
                if (!cancelled) setLogs([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        return logs.filter((l) => {
            if (actionFilter === 'ALL') return l.action === 'LOGIN' || l.action === 'LOGOUT';
            return l.action === actionFilter;
        });
    }, [logs, actionFilter]);

    return (
        <div className="min-h-screen bg-[#F7F9FC] flex text-slate-900">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 lg:hidden animate-fade-in"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="p-4 md:p-8 lg:p-10 w-full space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">Audit Logs</h1>
                            <p className="text-sm text-slate-500 font-semibold">Staff login and logout timeline</p>
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'LOGIN', 'LOGOUT'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setActionFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase border transition-all ${actionFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="grid grid-cols-12 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
                            <div className="col-span-2">Event</div>
                            <div className="col-span-3">Staff</div>
                            <div className="col-span-3">Email</div>
                            <div className="col-span-2">IP</div>
                            <div className="col-span-2">Timestamp</div>
                        </div>
                        {loading ? (
                            <div className="p-10 text-center text-slate-500 font-semibold">Loading logs...</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 font-semibold">No login/logout logs found.</div>
                        ) : (
                            filtered.map((log) => (
                                <div key={log.id} className="grid grid-cols-12 px-6 py-4 border-b border-slate-50 last:border-0 items-center text-sm">
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${log.action === 'LOGIN' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                            {log.action === 'LOGIN' ? <FaSignInAlt className="w-3 h-3" /> : <FaSignOutAlt className="w-3 h-3" />}
                                            {log.action}
                                        </span>
                                    </div>
                                    <div className="col-span-3 font-bold text-slate-800">{log.user?.name || 'Unknown'}</div>
                                    <div className="col-span-3 text-slate-500">{log.user?.email || '-'}</div>
                                    <div className="col-span-2 text-slate-500">{log.ipAddress || '-'}</div>
                                    <div className="col-span-2 text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

