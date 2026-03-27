import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
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
        <div className="min-h-screen bg-[#F7F9FC] flex text-slate-900">
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 lg:hidden animate-fade-in" onClick={() => setSidebarOpen(false)} />
            )}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="p-4 md:p-8 lg:p-10 w-full space-y-6">
                    <button onClick={() => navigate('/store-admin/staff')} className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-indigo-600">
                        <FaArrowLeft className="w-4 h-4" />
                        Back to Staff
                    </button>

                    {loading ? (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100">Loading staff details...</div>
                    ) : !staff ? (
                        <div className="bg-white rounded-3xl p-8 border border-slate-100">Staff member not found.</div>
                    ) : (
                        <>
                            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">{staff.name}</h1>
                                        <p className="text-slate-500 font-semibold">{staff.email}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${staff.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                        {staff.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Role</p>
                                        <p className="mt-1 font-bold text-slate-800 inline-flex items-center gap-2"><FaUserShield className="w-3 h-3" />{staff.role}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Last Login</p>
                                        <p className="mt-1 font-bold text-slate-800">{staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString() : 'Never'}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Last Logout</p>
                                        <p className="mt-1 font-bold text-slate-800">{staff.lastLogoutAt ? new Date(staff.lastLogoutAt).toLocaleString() : 'Never'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100">
                                    <h2 className="text-lg font-black tracking-tight">Login / Logout Activity</h2>
                                </div>
                                {(staff.authActivity ?? []).length === 0 ? (
                                    <div className="p-6 text-slate-500 font-semibold">No activity yet.</div>
                                ) : (
                                    (staff.authActivity ?? []).map((a, idx) => (
                                        <div key={`${a.action}-${a.at}-${idx}`} className="px-6 py-4 border-b border-slate-50 last:border-0 flex items-center justify-between gap-4">
                                            <div className="inline-flex items-center gap-2 font-black text-xs uppercase tracking-widest text-slate-700">
                                                {a.action === 'LOGIN' ? <FaSignInAlt className="w-3 h-3 text-emerald-600" /> : <FaSignOutAlt className="w-3 h-3 text-rose-600" />}
                                                {a.action}
                                            </div>
                                            <div className="text-sm text-slate-500">{new Date(a.at).toLocaleString()}</div>
                                            <div className="text-sm text-slate-500">{a.ipAddress || '-'}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

