import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';

export default function StoreAdminLayout() {
    return (
        <SidebarProvider>
            <StoreAdminLayoutContent />
        </SidebarProvider>
    );
}

function StoreAdminLayoutContent() {
    const { collapsed } = useSidebar();
    return (
        <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 transition-colors duration-500 text-slate-900 dark:text-slate-100 uppercase">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <TopNavbar />

                <main className="p-4 md:p-6 lg:p-8 w-full transition-all duration-300">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
