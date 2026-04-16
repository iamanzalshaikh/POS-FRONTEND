import { PanelLeftOpen, PanelLeftClose, User, LogOut, Settings, CircleUser } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavbarProps {
    portalLabel?: string;
    branchLabel?: string;
    onMenuClick?: () => void;
}

export default function TopNavbar({
    portalLabel = 'Store Admin Portal',
    branchLabel = 'Main Branch',
    onMenuClick,
}: TopNavbarProps) {
    const { collapsed, toggle, openMobile } = useSidebar();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleProfileClick = () => {
        const role = user?.role;
        if (!role) return;
        
        switch(role) {
            case 'SUPER_ADMIN': navigate('/super-admin/profile'); break;
            case 'STORE_ADMIN': navigate('/store-admin/profile'); break;
            case 'CASHIER': navigate('/cashier/profile'); break;
            case 'ACCOUNTANT': navigate('/accountant/profile'); break;
            default: navigate('/login');
        }
    };

    return (
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between shadow-sm shadow-slate-100/50 dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-4 sm:gap-6">
                <button
                    onClick={() => {
                        if (onMenuClick) {
                            onMenuClick();
                            return;
                        }
                        if (window.innerWidth < 1024) {
                            openMobile();
                        } else {
                            toggle();
                        }
                    }}
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? <PanelLeftOpen size={22} /> : <PanelLeftClose size={22} />}
                </button>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-widest uppercase hidden md:block">
                    {portalLabel}
                </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <ModeToggle />
                </div>

                <div className="h-8 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{branchLabel}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></span>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase">ONLINE</p>
                        </div>
                    </div>
                    
                    <div className="hidden md:block h-8 w-px bg-slate-100 dark:bg-slate-800"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-3 p-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all outline-none group border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                <div className="hidden md:block text-right">
                                    <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase">
                                        {(user?.role || 'member').replace('_', ' ')}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-300 overflow-hidden">
                                    {user?.profilePictureUrl ? (
                                        <img src={user.profilePictureUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : user?.name ? (
                                        <span className="font-black text-base tracking-widest">
                                            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </span>
                                    ) : (
                                        <CircleUser size={24} strokeWidth={1.5} />
                                    )}
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 rounded-xl border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <DropdownMenuLabel className="px-3 py-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Account</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                            <DropdownMenuItem 
                                onClick={handleProfileClick}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-950/30 dark:focus:text-indigo-400"
                            >
                                <User size={18} strokeWidth={1.5} />
                                <span className="text-sm font-medium">Profile Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50 dark:bg-slate-800" />
                            <DropdownMenuItem 
                                onClick={() => logout()}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30 dark:focus:text-rose-400 transition-colors"
                            >
                                <LogOut size={18} strokeWidth={1.5} />
                                <span className="text-sm font-medium">Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
