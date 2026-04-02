
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
    Columns2,
    Store,
    ClipboardList,
    Settings,
    LogOut,
    Shield,
    Activity
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", icon: Columns2, path: "/super-admin/dashboard" },
    { name: "Stores", icon: Store, path: "/super-admin/stores" },
    { name: "Billing", icon: ClipboardList, path: "/super-admin/billing" },
    { name: "Subscription", icon: ClipboardList, path: "/super-admin/subscription" },
    { name: "Activity Logs", icon: Activity, path: "/super-admin/audit-logs" },
    { name: "Settings", icon: Settings, path: "/super-admin/settings" }
];

interface SuperAdminSidebarProps {
    collapsed?: boolean;
}

const SuperAdminSidebar = ({ collapsed = false }: SuperAdminSidebarProps) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/super-admin/login');
    };

    return (
        <aside
            className={`bg-[#262255] border-r border-[#262255]/20 text-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-[260px]'
                }`}
        >
            {/* Brand Section */}
            <div className={`border-b border-white/10 overflow-hidden ${collapsed ? 'p-4' : 'p-8'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <Shield size={22} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="font-bold text-lg text-white tracking-tight leading-none uppercase truncate">Hybrid POS</h1>
                            <p className="text-[10px] font-medium text-indigo-300 mt-1 uppercase tracking-widest truncate">Network Admin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={index}
                            to={item.path}
                            title={collapsed ? item.name : undefined}
                            className={({ isActive }) =>
                                `flex items-center rounded-xl transition-all duration-200 group relative ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                                } ${isActive
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/30"
                                    : "hover:bg-[#2A2760] hover:text-white text-slate-300"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors shrink-0"} />
                                    {!collapsed && (
                                        <span className="font-medium text-sm tracking-tight animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                            {item.name}
                                        </span>
                                    )}
                                    {isActive && (
                                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-r-full ${collapsed ? 'block' : 'block'}`} />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className={`border-t border-white/10 ${collapsed ? 'p-2' : 'p-4'}`}>
                <div className={`bg-[#2A2760] rounded-2xl flex items-center border border-white/5 transition-all ${collapsed ? 'flex-col p-2 gap-4' : 'p-4 gap-3'
                    }`}>
                    <div className="w-10 h-10 rounded-full bg-[#312E81] flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-sm shrink-0">
                        {(user?.name || 'SA')[0].toUpperCase()}
                    </div>
                    {!collapsed ? (
                        <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Super Admin'}</p>
                            <p className="text-[10px] text-indigo-300 font-medium uppercase truncate tracking-wide">Infrastructure</p>
                        </div>
                    ) : null}
                    <button
                        onClick={handleLogout}
                        className={`text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all shrink-0 ${collapsed ? 'p-2' : 'p-2'
                            }`}
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
