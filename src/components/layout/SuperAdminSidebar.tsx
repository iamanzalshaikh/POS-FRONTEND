
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    LayoutDashboard,
    Store,
    ClipboardList,
    Settings,
    LogOut,
    Shield
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/super-admin/dashboard" },
    { name: "Stores", icon: Store, path: "/super-admin/stores" },
    { name: "Audit Logs", icon: ClipboardList, path: "/super-admin/audit-logs" },
    { name: "Settings", icon: Settings, path: "/super-admin/settings" }
];

const SuperAdminSidebar = () => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/super-admin/login');
    };

    return (
        <aside className="w-[260px] bg-[#262255] border-r border-[#262255]/20 text-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50">
            {/* Brand Section */}
            <div className="p-8 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                        <Shield size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white tracking-tight leading-none uppercase">Hybrid POS</h1>
                        <p className="text-[10px] font-medium text-indigo-300 mt-1 uppercase tracking-widest">Network Admin</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/30"
                                    : "hover:bg-[#2A2760] hover:text-white text-slate-300"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
                                    <span className="font-medium text-sm tracking-tight">{item.name}</span>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-400 rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-white/10">
                <div className="bg-[#2A2760] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#312E81] flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-sm">
                        {(user?.name || 'SA')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Super Admin'}</p>
                        <p className="text-[10px] text-indigo-300 font-medium uppercase truncate tracking-wide">Infrastructure</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default SuperAdminSidebar;
