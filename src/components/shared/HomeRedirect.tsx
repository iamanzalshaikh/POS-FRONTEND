import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Intelligent redirection component that routes authenticated users
 * to their specific role-based dashboard.
 */
const HomeRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  console.log(`🏠 [REDIRECT] Authenticated user found: ${user?.email}. Role: "${user?.role}"`);

  switch (user?.role) {
    case 'SUPER_ADMIN': return <Navigate to="/super-admin/dashboard" replace />;
    case 'STORE_ADMIN': return <Navigate to="/store-admin/dashboard" replace />;
    case 'CASHIER': return <Navigate to="/cashier" replace />;
    case 'ACCOUNTANT': return <Navigate to="/accountant" replace />;
    default: 
      console.warn(`🏠 [REDIRECT] UNKNOWN ROLE: "${user?.role}". Sending to /unauthorized`);
      return <Navigate to="/unauthorized" replace />;
  }
};

export default HomeRedirect;
