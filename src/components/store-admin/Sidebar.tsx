import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Columns2,
    Users,
    Boxes,
    ShoppingCart,
    Monitor,
    BarChart3,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Package,
    Layers,
    Settings2,
    Activity
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const menuItems = [
    { name: 'Dashboard', icon: Columns2, path: '/store-admin/dashboard' },
    { name: 'Staff Management', icon: Users, path: '/store-admin/staff' },
    {
        name: 'Inventory',
        icon: Boxes,
        path: '/store-admin/inventory',
        children: [
            { name: 'Stock Levels', icon: Layers, path: '/store-admin/inventory/stocks' },
            { name: 'Products', icon: Package, path: '/store-admin/inventory/products' },
            { name: 'Categories', icon: Layers, path: '/store-admin/categories' },
            { name: 'Adjustments', icon: Settings2, path: '/store-admin/inventory/adjustments' },
        ]
    },
    { name: 'Sales History', icon: ShoppingCart, path: '/store-admin/sales' },
    { name: 'Devices', icon: Monitor, path: '/store-admin/devices' },
    { name: 'Reports', icon: BarChart3, path: '/store-admin/reports' },
    { name: 'Activity Logs', icon: Activity, path: '/store-admin/activity-logs' },
    { name: 'Store Settings', icon: Settings, path: '/store-admin/settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { logout } = useAuthStore();
    const [inventoryOpen, setInventoryOpen] = React.useState(true);

    return (
        <aside className={`w-64 bg-[#262255] border-r border-[#262255]/20 text-slate-200 h-screen fixed top-0 flex flex-col z-60 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} left-0 shadow-sm lg:shadow-none`}>
            {/* Close button (Mobile only) */}
            <button
                onClick={onClose}
                className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
            >
                <ChevronRight size={20} className="rotate-180" />
            </button>

            {/* Brand */}
            <div className="p-6 border-b border-slate-100/10 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#262255] rounded-xl flex items-center justify-center shadow-indigo-100 shadow-xl border border-indigo-500/20">
                        <Columns2 size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-white tracking-tight leading-none">Hybrid POS</h1>
                        <p className="text-[10px] font-medium text-slate-300 mt-1 uppercase tracking-widest">STORE ADMIN</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item, idx) => {
                    if (item.children) {
                        return (
                            <div key={idx} className="space-y-1">
                                <button
                                    onClick={() => setInventoryOpen(!inventoryOpen)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-[#2A2760] text-slate-300 hover:text-white group"
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                                        <span className="font-medium text-sm tracking-tight">{item.name}</span>
                                    </div>
                                    {inventoryOpen ? <ChevronDown size={14} className="text-slate-400 group-hover:text-[#262255]" /> : <ChevronRight size={14} className="text-slate-400 group-hover:text-[#262255]" />}
                                </button>
                                {inventoryOpen && (
                                    <div className="pl-12 space-y-1 border-l-2 border-slate-100 ml-6 py-1">
                                        {item.children.map((child, cIdx) => (
                                            <NavLink
                                                key={cIdx}
                                                to={child.path}
                                                className={({ isActive }) =>
                                                    `block py-2 px-2 text-sm font-medium rounded-lg transition-all hover:text-white hover:bg-[#2A2760] ${isActive ? 'text-white bg-[#2A2760]' : 'text-slate-400'}`
                                                }
                                            >
                                                {child.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <NavLink
                            key={idx}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${isActive
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/30"
                                    : "hover:bg-[#2A2760] hover:text-white text-slate-300"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors"} />
                                    <span className="font-medium text-sm tracking-tight">{item.name}</span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-slate-100/10 dark:border-slate-800/50">
                <div className="bg-[#2A2760] rounded-2xl p-4 flex items-center gap-3 border border-[#2A2760]/20">
                    <div className="w-10 h-10 rounded-full bg-[#262255] flex items-center justify-center text-white font-black shadow-indigo-100 shadow-md border-2 border-white">
                        AM
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">Anzal Manager</p>
                        <p className="text-[10px] text-slate-300 font-medium uppercase truncate">KARACHI BRANCH</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}