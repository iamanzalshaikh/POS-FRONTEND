import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import MainSidebar from './MainSidebar';
import PageLoader from '../ui/PageLoader';
import { LayoutDashboard, Store, ClipboardList, Settings, Shield, User } from "lucide-react";
import { useSidebar } from '@/components/ui/sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';

const superAdminMenu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/super-admin/dashboard" },
    { name: "Stores", icon: Store, path: "/super-admin/stores" },
    { name: "Audit Logs", icon: ClipboardList, path: "/super-admin/audit-logs" },
    { 
        name: "Settings", 
        icon: Settings, 
        path: "/super-admin/settings",
       
    }
];

const SuperAdminLayout: React.FC = () => {
    const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            hydrate();
        }
    }, [isAuthenticated, hydrate]);

    const { collapsed } = useSidebar();
    
    if (isLoading) {
        return <PageLoader />;
    }

    // Protect route: Must be authenticated and have SUPER_ADMIN role
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.role !== 'SUPER_ADMIN') {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 font-sans transition-colors duration-300">
            <MainSidebar menuItems={superAdminMenu} roleName="Super Admin" brandIcon={Shield} />
            
            <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <TopNavbar portalLabel="Super Admin Portal" branchLabel="Control Plane" />

                <main className="p-4 md:p-6 lg:p-8 w-full transition-all duration-300">
                    <div className="space-y-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            <div id="admin-toasts" className="fixed top-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none" />
        </div>
    );
};

export default SuperAdminLayout;
