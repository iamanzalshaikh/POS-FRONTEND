import React from 'react';
import { Menu } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
                        <div className="flex items-center gap-3 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-none">Anzal Shaikh</p>
                                <p className="text-[10px] text-slate-500 font-medium">Head of Operations</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-[#1a192b] flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform shadow-lg shadow-indigo-100">
                                AS
                            </div>
                        </div>
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
