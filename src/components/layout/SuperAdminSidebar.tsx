import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Store,
    ClipboardList,
    Settings,
    Shield
} from "lucide-react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/super-admin/dashboard" },
    { name: "Stores", icon: Store, path: "/super-admin/stores" },
    { name: "Audit Logs", icon: ClipboardList, path: "/super-admin/audit-logs" },
    { name: "Settings", icon: Settings, path: "/super-admin/settings" }
];

const SuperAdminSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
    return (
        <aside className={`bg-[#262255] border-r border-[#262255]/20 text-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 ${collapsed ? "w-20" : "w-[260px]"}`}>
            {/* Brand Section */}
            <div className={`border-b border-white/10 transition-all duration-300 ${collapsed ? "p-4" : "p-8"}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                        <Shield size={22} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="font-bold text-lg text-white tracking-tight leading-none uppercase">Hybrid POS</h1>
                            <p className="text-[10px] font-medium text-indigo-300 mt-1 uppercase tracking-widest">Network Admin</p>
                        </div>
                    )}
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
                                    {!collapsed && <span className="font-medium text-sm tracking-tight">{item.name}</span>}
                                    {isActive && !collapsed && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-400 rounded-r-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

        </aside>
    );
};

export default SuperAdminSidebar;
