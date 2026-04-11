import React from 'react';
import { Menu } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { useAuthStore } from '@/store/useAuthStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, logout } = useAuthStore();

    return (
        <SidebarProvider>
          <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            <AppSidebar />

            <div className="flex-1 flex flex-col transition-all duration-300">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div>
                          <SidebarTrigger className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg lg:hidden">
                            <Menu size={24} />
                          </SidebarTrigger>
                        </div>
                        <div className="hidden lg:block">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Terminal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 cursor-pointer group outline-none">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                            {user?.name || 'Anzal Shaikh'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1">
                                            {user?.role?.replace('_', ' ') || 'Head of Operations'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-[#1a192b] flex items-center justify-center text-white font-black group-hover:scale-105 transition-all shadow-lg shadow-indigo-100 group-hover:bg-indigo-600">
                                        {(user?.name || 'AS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 rounded-xl border-slate-100 shadow-xl">
                                <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Account
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600">
                                    <User size={18} />
                                    <span className="text-sm font-medium">Profile Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                    onClick={() => logout()}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600"
                                >
                                    <LogOut size={18} />
                                    <span className="text-sm font-medium">Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </div>
          </div>
        </SidebarProvider>
    )
}
