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
    ChevronDown,
    ChevronRight,
    Package,
    Layers,
    Settings2,
    X
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/useAuthStore';

interface MenuItem {
    name: string;
    icon: any;
    path: string;
    exact?: boolean;
    children?: { name: string; icon?: any; path: string; exact?: boolean }[];
}

interface MainSidebarProps {
    menuItems: MenuItem[];
    roleName: string;
    brandIcon?: any;
}

export default function MainSidebar({ menuItems, roleName, brandIcon: BrandIcon = Columns2 }: MainSidebarProps) {
    const { collapsed, isMobileOpen, closeMobile } = useSidebar();
    const { user } = useAuthStore();
    const [openSubmenu, setOpenSubmenu] = React.useState<string | null>("Inventory"); // Default to open Inventory if it exists

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeMobile}
                ></div>
            )}

            <aside className={`bg-[#262255] border-r border-[#2A2760]/20 text-slate-300 h-screen fixed top-0 left-0 flex flex-col z-50 transition-all duration-300 ease-in-out ${
                isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            } ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Close button (Mobile only) */}
                <button
                    onClick={closeMobile}
                    className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Brand */}
                <div className={`p-6 border-b border-white/10 transition-all duration-300 ${collapsed ? 'px-4' : 'px-6'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`min-w-10 w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 overflow-hidden ${user?.store?.logoUrl ? 'bg-white p-1' : 'bg-white/10'}`}>
                            {user?.store?.logoUrl ? (
                                <img src={user.store.logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                            ) : (
                                <BrandIcon size={24} className="text-white" />
                            )}
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
                                <h1 className="font-bold text-xl text-white tracking-tight leading-none uppercase">
                                    {user?.store?.name?.split(' ')[0] || "Hybrid"} <span className="text-indigo-400">{user?.store?.name?.split(' ')[1] || "POS"}</span>
                                </h1>
                                <p className="text-[10px] font-medium text-indigo-300/60 mt-1 uppercase tracking-widest">{roleName}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {menuItems.map((item, idx) => {
                        const isSubmenuOpen = openSubmenu === item.name;
                        if (item.children) {
                            return (
                                <div key={idx} className="space-y-1">
                                    <button
                                        onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.name)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:bg-white/10 text-slate-300 hover:text-white group ${collapsed ? 'px-2 justify-center' : ''}`}
                                        title={collapsed ? item.name : ""}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} className="text-slate-400 group-hover:text-white transition-colors min-w-5" />
                                            {!collapsed && <span className="font-medium text-sm tracking-tight">{item.name}</span>}
                                        </div>
                                        {!collapsed && (isSubmenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                                    </button>
                                    {isSubmenuOpen && !collapsed && (
                                        <div className="pl-12 space-y-1 border-l-2 border-white/10 ml-6 py-1">
                                            {item.children.map((child, cIdx) => (
                                                    <NavLink
                                                        key={cIdx}
                                                        to={child.path}
                                                        end={child.exact}
                                                        className={({ isActive }) =>
                                                            `block py-2 px-2 text-sm font-medium rounded-lg transition-all hover:text-white hover:bg-white/5 ${isActive ? 'text-white bg-white/10' : 'text-slate-400'}`
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
                                end={item.exact}
                                title={collapsed ? item.name : ""}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${collapsed ? 'px-2 justify-center' : ''} ${isActive
                                        ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                        : "hover:bg-white/10 text-slate-300 hover:text-white"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white transition-colors min-w-5"} />
                                        {!collapsed && <span className="font-medium text-sm tracking-tight">{item.name}</span>}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

            </aside>
        </>
    );
}
