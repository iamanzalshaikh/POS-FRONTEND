import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import DashboardLayout from '@/components/layout/DashboardLayout';

// UI Components
import PageLoader from '@/components/ui/PageLoader';
import HomeRedirect from '@/components/shared/HomeRedirect';

// Lazy loading pages 
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CreateStorePage = lazy(() => import('@/pages/super-admin/CreateStorePage'));
const EditStorePage = lazy(() => import('@/pages/super-admin/EditStorePage'));

const StoreAdminDashboard = lazy(() => import('@/pages/store-admin/dashboard/StoreAdminDashboard'));
const StaffManagementPage = lazy(() => import('@/pages/store-admin/staff-management/StaffManagementPage'));
const CashierDashboard = lazy(() => import('@/pages/cashier/CashierDashboard'));
const AccountantDashboard = lazy(() => import('@/pages/accountant/AccountantDashboard'));

const Unauthorized = lazy(() => import('@/pages/Unauthorized'));
const ProtectedRoute = lazy(() => import('@/components/shared/ProtectedRoute'));

const ProductsManagementPage = lazy(() => import('@/pages/store-admin/products-management/ProductsManagementPage'));
const AddProductPage = lazy(() => import('@/pages/store-admin/products-management/AddProductPage'));
const DevicesManagementPage = lazy(() => import('@/pages/store-admin/devices-management/DevicesManagementPage'));
const SalesHistoryPage = lazy(() => import('@/pages/store-admin/sales/SalesHistoryPage'));
const ProductCategories = lazy(() => import('@/pages/store-admin/products-management/ProductCategoriesPage'));
const InventoryManagement = lazy(() => import('@/pages/store-admin/inventory/InventoryManagementPage'));
const StockLevelsPage = lazy(() => import('@/pages/store-admin/inventory/StockLevelsPage'));
const SettingsPage = lazy(() => import('@/pages/store-admin/settings/SettingsPage'));
const StockAdjustmentPage = lazy(() => import('@/pages/store-admin/inventory/StockAdjustmentPage'));
const ReportsPage = lazy(() => import('@/pages/store-admin/reports/ReportsPage'));
const StaffDetailPage = lazy(() => import('@/pages/store-admin/staff-management/StaffDetailPage'));
const ActivityLogsPage = lazy(() => import('@/pages/store-admin/ActivityLogsPage'));

// Super Admin Revised Panel
const SuperAdminLayout = lazy(() => import('@/components/layout/SuperAdminLayout'));
const SuperAdminLoginPage = lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const SuperAdminDashboard = lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const StoresListPage = lazy(() => import('@/pages/super-admin/StoresListPage'));
const SuperAdminAuditLogs = lazy(() => import('@/pages/super-admin/SuperAdminAuditLogs'));
const SuperAdminSettings = lazy(() => import('@/pages/super-admin/SuperAdminSettings'));
const StoreDetailsPage = lazy(() => import('@/pages/super-admin/StoreDetailsPage'));
const SuperAdminBillingPage = lazy(() => import('@/pages/super-admin/billing/BillingPage'));
const SuperAdminPaymentHistoryPage = lazy(() => import('@/pages/super-admin/billing/PaymentHistoryPage'));
const SuperAdminSubscriptionPage = lazy(() => import('@/pages/super-admin/subscription/SubscriptionPage'));

const App: React.FC = () => {
  const { hydrate, isLoading } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Role-Specific Protected Routes */}

          <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<DashboardLayout children={<Outlet />} />}>
              <Route path="/store-admin/dashboard" element={<StoreAdminDashboard />} />
              <Route path="/store-admin/staff" element={<StaffManagementPage />} />
              <Route path="/store-admin/staff/:id" element={<StaffDetailPage />} />
              <Route path="/store-admin/inventory" element={<InventoryManagement />} />
              <Route path="/store-admin/inventory/stocks" element={<StockLevelsPage />} />
              <Route path="/store-admin/inventory/adjustments" element={<StockAdjustmentPage />} />
              <Route path="/store-admin/inventory/products" element={<ProductsManagementPage />} />
              <Route path="/store-admin/inventory/products/add" element={<AddProductPage />} />
              <Route path="/store-admin/settings" element={<SettingsPage />} />
              <Route path="/store-admin/devices" element={<DevicesManagementPage />} />
              <Route path="/store-admin/sales" element={<SalesHistoryPage />} />
              <Route path="/store-admin/categories" element={<ProductCategories />} />
              <Route path="/store-admin/reports" element={<ReportsPage />} />
              <Route path="/store-admin/activity-logs" element={<ActivityLogsPage />} />
              <Route path="/store-admin" element={<Navigate to="/store-admin/dashboard" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<DashboardLayout children={<Outlet />} />}>
              <Route path="/cashier/*" element={<CashierDashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ACCOUNTANT', 'STORE_ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<DashboardLayout children={<Outlet />} />}>
              <Route path="/accountant/*" element={<AccountantDashboard />} />
            </Route>
          </Route>

          {/* Legacy Admin Redirects */}
          <Route path="/admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />

          {/* New Super Admin Panel (Production SaaS) */}
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/stores" element={<StoresListPage />} />
            <Route path="/super-admin/stores/create" element={<CreateStorePage />} />
            <Route path="/super-admin/stores/edit/:id" element={<EditStorePage />} />
            <Route path="/super-admin/stores/:id" element={<StoreDetailsPage />} />
            <Route path="/super-admin/stores/:id/users" element={<StoreDetailsPage />} />
            <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
            <Route path="/super-admin/billing" element={<SuperAdminBillingPage />} />
            <Route path="/super-admin/billing/payments" element={<SuperAdminPaymentHistoryPage />} />
            <Route path="/super-admin/subscription" element={<SuperAdminSubscriptionPage />} />
            <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
            <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
          </Route>

          {/* Intelligent Redirect Handling */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
