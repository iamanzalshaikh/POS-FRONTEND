import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Columns2,
    Users,
    Settings,
    Monitor,
    ChevronRight,
    LogOut,
    Store
} from "lucide-react";

const menu = [
    { name: "Dashboard", icon: Columns2, path: "/admin/dashboard" },
    { name: "Stores", icon: Store, path: "/admin/stores" },
    { name: "Global Admins", icon: Users, path: "/admin/admins" },
    { name: "Manage Devices", icon: Monitor, path: "/admin/devices" },
    { name: "Global Settings", icon: Settings, path: "/admin/settings" }
];

interface SidebarProps {
    collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside
            className={`bg-[#262255] border-r border-[#2A2760]/20 h-screen fixed left-0 top-0 flex flex-col z-50 text-slate-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-[240px]'
                }`}
        >
            {/* Top Section */}
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'p-4' : 'p-6'}`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#1a192b] rounded-xl flex items-center justify-center shadow-lg transform rotate-3 shrink-0">
                        <Columns2 size={24} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="font-extrabold text-xl text-white tracking-tight leading-none truncate">Hybrid POS</h1>
                            <p className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest truncate">ADMIN CONSOLE</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {menu.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={index}
                            to={item.path}
                            title={collapsed ? item.name : undefined}
                            className={({ isActive }) =>
                                `flex items-center justify-between rounded-xl transition-all duration-200 group ${collapsed ? 'p-3 justify-center' : 'px-4 py-2.5'
                                } ${isActive
                                    ? "bg-[#2A2760] text-white shadow-md shadow-indigo-900/10"
                                    : "text-slate-300 hover:bg-[#2A2760] hover:text-white"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className="group-hover:scale-110 transition-transform shrink-0" />
                                        {!collapsed && (
                                            <span className="font-bold text-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                                                {item.name}
                                            </span>
                                        )}
                                    </div>
                                    {isActive && !collapsed && (
                                        <ChevronRight size={14} className="text-indigo-400 animate-in fade-in slide-in-from-left-2 duration-300" />
                                    )}
                                    {isActive && collapsed && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className={`border-t border-white/10 transition-all duration-300 ${collapsed ? 'p-2' : 'p-4'}`}>
                <div className="flex flex-col gap-2">
                    <div className={`bg-[#2A2760] rounded-2xl flex items-center transition-all duration-300 ${collapsed ? 'p-2 justify-center' : 'p-4 gap-3'
                        }`}>
                        <div className="w-8 h-8 rounded-full bg-[#262255] border border-[#2A2760] flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                            SA
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                                <p className="text-xs font-bold text-white truncate">Super Admin</p>
                                <p className="text-[10px] text-slate-300 truncate">Global Region</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center text-slate-300 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all font-bold text-sm ${collapsed ? 'p-3 justify-center' : 'px-4 py-3 gap-3'
                            }`}
                        title="Logout"
                    >
                        <LogOut size={18} className="shrink-0" />
                        {!collapsed && <span className="animate-in fade-in slide-in-from-left-2 duration-300">Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
