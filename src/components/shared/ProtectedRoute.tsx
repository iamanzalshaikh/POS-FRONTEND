import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  allowedRoles?: ('SUPER_ADMIN' | 'STORE_ADMIN' | 'CASHIER' | 'ACCOUNTANT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const hasAccess = allowedRoles.includes(user.role);
    if (!hasAccess) {
      console.warn(`🔒 [RBAC] Access Denied for ${user.email}. Role: "${user.role}" | Allowed:`, allowedRoles);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
