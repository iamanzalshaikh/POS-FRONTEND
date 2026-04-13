import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Package,
    Users,
    Monitor,
    Settings,
    ChevronDown,
    ChevronUp,
    BarChart3,
    ShoppingCart,
    Wallet,
} from "lucide-react";
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types/auth';

const FINANCE_PORTAL_ROLES: UserRole[] = ['STORE_ADMIN', 'SUPER_ADMIN', 'ACCOUNTANT'];

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const showFinancePortal = user?.role && FINANCE_PORTAL_ROLES.includes(user.role);

    // State to manage the Inventory dropdown
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    // Auto-expand Inventory if we are on an inventory-related page
    useEffect(() => {
        if (location.pathname.startsWith('/store-admin/inventory') || location.pathname.startsWith('/store-admin/categories')) {
            setIsInventoryOpen(true);
        }
    }, [location.pathname]);


    const mainButtons = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/store-admin/dashboard" },
        { name: "Staff Management", icon: Users, path: "/store-admin/staff" },
    ];

    const inventoryItems = [
        { name: "Stock Levels", path: "/store-admin/inventory/stocks" },
        { name: "Products", path: "/store-admin/inventory/products" },
        { name: "Categories", path: "/store-admin/categories" },
        { name: "Adjustments", path: "/store-admin/inventory/adjustments" },
    ];

    const lowerButtons = [
        { name: "Sales", icon: ShoppingCart, path: "/store-admin/sales" },
        { name: "Devices", icon: Monitor, path: "/store-admin/devices" },
        { name: "Reports", icon: BarChart3, path: "/store-admin/reports" },
        { name: "Store Settings", icon: Settings, path: "/store-admin/settings" },
    ];

    return (
        <aside
            className={`bg-[#262255] border-r border-[#2A2760]/20 h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-[260px]'}`}
        >
            {/* Top Section */}
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'p-4' : 'p-8'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100/20 shadow-lg shrink-0">
                        <LayoutDashboard size={22} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className="font-black text-xl text-white tracking-tight leading-none uppercase">Hybrid POS</h1>
                            <p className="text-[10px] font-black text-indigo-300 mt-1 uppercase tracking-widest truncate">Store Admin</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation items */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                {/* Main Buttons */}
                {mainButtons.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl transition-all duration-200 px-4 py-3 group relative ${
                                isActive
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/20 border border-white/5"
                                    : "text-slate-400 hover:bg-[#2A2760] hover:text-white"
                            }`
                        }
                    >
                        <item.icon size={20} className="shrink-0" />
                        {!collapsed && <span className="font-bold text-[13px] tracking-tight">{item.name}</span>}
                    </NavLink>
                ))}

                {/* Inventory Dropdown */}
                <div className="space-y-1">
                    <button
                        onClick={() => !collapsed && setIsInventoryOpen(!isInventoryOpen)}
                        className={`w-full flex items-center justify-between rounded-xl transition-all duration-200 px-4 py-3 group ${
                            (isInventoryOpen || location.pathname.includes('/inventory') || location.pathname.includes('/categories')) && !collapsed
                                ? "text-white bg-indigo-500/5"
                                : "text-slate-400 hover:bg-[#2A2760] hover:text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Package size={20} className="shrink-0" />
                            {!collapsed && <span className="font-bold text-[13px] tracking-tight">Inventory</span>}
                        </div>
                        {!collapsed && (
                            isInventoryOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />
                        )}
                    </button>

                    {/* Sub Items */}
                    {!collapsed && isInventoryOpen && (
                        <div className="pl-12 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {inventoryItems.map((sub) => (
                                <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    className={({ isActive }) =>
                                        `block py-2 text-[13px] font-bold transition-all ${
                                            isActive
                                                ? "text-indigo-400"
                                                : "text-slate-500 hover:text-white"
                                        }`
                                    }
                                >
                                    {sub.name}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lower Buttons */}
                {lowerButtons.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl transition-all duration-200 px-4 py-3 group relative ${
                                isActive
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/20 border border-white/5"
                                    : "text-slate-400 hover:bg-[#2A2760] hover:text-white"
                            }`
                        }
                    >
                        <item.icon size={20} className="shrink-0" />
                        {!collapsed && <span className="font-bold text-[13px] tracking-tight">{item.name}</span>}
                    </NavLink>
                ))}

                {showFinancePortal && (
                    <NavLink
                        to="/accountant"
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl transition-all duration-200 px-4 py-3 group relative border border-transparent ${
                                isActive || location.pathname.startsWith('/accountant')
                                    ? "bg-[#2A2760] text-white shadow-lg shadow-indigo-900/20 border-white/10"
                                    : "text-slate-400 hover:bg-[#2A2760] hover:text-white"
                            }`
                        }
                    >
                        <Wallet size={20} className="shrink-0" />
                        {!collapsed && (
                            <span className="font-bold text-[13px] tracking-tight">Accountant dashboard</span>
                        )}
                    </NavLink>
                )}
            </nav>

        </aside>
    );
}
