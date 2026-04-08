import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import PageLoader from '../ui/PageLoader';

import DashboardLayout from './DashboardLayout';

const SuperAdminLayout: React.FC = () => {
    const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated) {
            hydrate();
        }
    }, [isAuthenticated, hydrate]);

    if (isLoading) {
        return <PageLoader />;
    }

    // Protect route: Must be authenticated and have SUPER_ADMIN role
    if (!isAuthenticated) {
        return <Navigate to="/super-admin/login" state={{ from: location }} replace />;
    }

    if (user?.role !== 'SUPER_ADMIN') {
        return <Navigate to="/unauthorized" replace />;
    }

    return (
        <DashboardLayout>
            <Outlet />
            <div id="admin-toasts" className="fixed top-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none" />
        </DashboardLayout>
    );
};

export default SuperAdminLayout;
