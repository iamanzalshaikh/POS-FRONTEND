import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStaffMemberById } from '@/api/staff.api';
import { FaArrowLeft, FaSignInAlt, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import type { StaffAuthActivity } from './types/staff.types';

type StaffDetail = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt?: string | null;
    lastLogoutAt?: string | null;
    createdAt: string;
    assignedTerminals?: { id: string; deviceName: string }[];
    authActivity?: StaffAuthActivity[];
};

export default function StaffDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        fetchStaffMemberById(id)
            .then((res) => {
                if (cancelled) return;
                const payload = res.data as { data?: StaffDetail };
                setStaff(payload.data ?? null);
            })
            .catch(() => {
                if (!cancelled) setStaff(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [id]);

    return (
        <div className="animate-fade-in space-y-6">
            <button onClick={() => navigate('/store-admin/staff')} className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-blue-600 transition-colors">
                <FaArrowLeft className="w-4 h-4" />
                Back to Staff
            </button>

            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">Loading staff details...</p>
                </div>
            ) : !staff ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest text-center">Staff member not found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-none">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">{staff.name}</h1>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mt-2">{staff.email}</p>
                            </div>
                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                staff.isActive 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50' 
                                    : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50'
                            }`}>
                                {staff.isActive ? 'Active Member' : 'Deactivated'}
                            </span>
                        </div>
                        
                        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100/50 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Role / Access Level</p>
                                <p className="mt-2 font-black text-slate-900 dark:text-white inline-flex items-center gap-2 uppercase tracking-tight">
                                    <FaUserShield className="w-4 h-4 text-blue-500" />
                                    {staff.role}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100/50 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Last Login Session</p>
                                <p className="mt-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never Recorded'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100/50 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">Last Activity End</p>
                                <p className="mt-2 font-black text-slate-900 dark:text-white uppercase tracking-tight">{staff.lastLogoutAt ? new Date(staff.lastLogoutAt).toLocaleString() : 'Never Recorded'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Login / Logout Activity</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Server-side Audit Trailing</p>
                        </div>
                        {(staff.authActivity ?? []).length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No terminal activity recorded for this user.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {(staff.authActivity ?? []).map((a, idx) => (
                                    <div key={`${a.action}-${a.at}-${idx}`} className="px-8 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="inline-flex items-center gap-3 font-black text-[11px] uppercase tracking-widest">
                                            {a.action === 'LOGIN' 
                                                ? <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><FaSignInAlt className="w-4 h-4 text-emerald-600" /></div> 
                                                : <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center"><FaSignOutAlt className="w-4 h-4 text-rose-600" /></div>
                                            }
                                            <span className={a.action === 'LOGIN' ? 'text-emerald-600' : 'text-rose-600'}>{a.action}</span>
                                        </div>
                                        <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{new Date(a.at).toLocaleString()}</div>
                                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono shrink-0 hidden sm:block">IP: {a.ipAddress || 'INTERNAL'}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

