import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { getDashboardSummary, getStoreInfo } from './api/dashboard.api';
import { fetchProducts } from './api/products.api';

// UI Components
import { ThemeProvider } from '@/components/theme-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import PageLoader from '@/components/ui/PageLoader';
import HomeRedirect from '@/components/shared/HomeRedirect';
import StoreAdminLayout from '@/components/layout/StoreAdminLayout';
import { Toaster } from '@/components/ui/toaster';
import SocketInvalidator from '@/components/shared/SocketInvalidator';

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
const ReportsPage = lazy(() => import('./pages/store-admin/reports/ReportsPage'));
const AuditLogsPage = lazy(() => import('./pages/store-admin/audit-logs/AuditLogsPage'));
const StaffDetailPage = lazy(() => import('@/pages/store-admin/staff-management/StaffDetailPage'));
const SuppliersPage = lazy(() => import('@/pages/store-admin/purchasing/SuppliersPage'));
const SupplierPurchasesListPage = lazy(() => import('@/pages/store-admin/purchasing/SupplierPurchasesListPage'));
const NewSupplierPurchasePage = lazy(() => import('@/pages/store-admin/purchasing/NewSupplierPurchasePage'));
const SupplierPurchaseDetailPage = lazy(() => import('@/pages/store-admin/purchasing/SupplierPurchaseDetailPage'));
const OpeningStockPage = lazy(() => import('@/pages/store-admin/purchasing/OpeningStockPage'));
const OpeningStockHistoryPage = lazy(() => import('@/pages/store-admin/purchasing/OpeningStockHistoryPage'));
const ProfilePage = lazy(() => import('@/pages/shared/ProfilePage'));

// Super Admin Revised Panel
const SuperAdminLayout = lazy(() => import('@/components/layout/SuperAdminLayout'));
const SuperAdminLoginPage = lazy(() => import('@/pages/super-admin/SuperAdminLoginPage'));
const SuperAdminDashboard = lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const StoresListPage = lazy(() => import('@/pages/super-admin/StoresListPage'));
const SuperAdminAuditLogs = lazy(() => import('@/pages/super-admin/SuperAdminAuditLogs'));
const SuperAdminSettings = lazy(() => import('@/pages/super-admin/SuperAdminSettings'));
const StoreDetailsPage = lazy(() => import('@/pages/super-admin/StoreDetailsPage'));

const App: React.FC = () => {
  const { hydrate, isLoading, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Global Prefetching Strategy - Simplified to avoid massive concurrent overhead
  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role;
      const storeId = user.storeId || user.store?.id;
      
      console.log(`⚡ [PREFETCH] Initializing critical sync for ${role}...`);
      
      // Store Admin critical metadata (lightweight)
      if (role === 'STORE_ADMIN' && storeId) {
        queryClient.prefetchQuery({
          queryKey: ['store-info', storeId],
          queryFn: () => getStoreInfo(storeId),
          staleTime: 1000 * 60 * 10
        });
      }

      // Cashier critical metadata: Prefetch products to have them ready for POS
      if (role === 'CASHIER') {
        queryClient.prefetchQuery({
          queryKey: ['pos-products'], // Matches POSInterface.tsx
          queryFn: () => fetchProducts(),
          staleTime: 1000 * 60 * 5
        });
      }
    }
  }, [isAuthenticated, user?.id, queryClient]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Redirect authenticated users away from login
  const getDashboardRoute = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return '/super-admin/dashboard';
      case 'STORE_ADMIN': return '/store-admin/dashboard';
      case 'CASHIER': return '/cashier';
      case 'ACCOUNTANT': return '/accountant';
      default: return '/';
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <SidebarProvider defaultOpen={true}>
        <Toaster />
        <Router>
          <SocketInvalidator />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                isAuthenticated && user
                  ? <Navigate to={getDashboardRoute(user.role)} replace />
                  : <LoginPage />
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Role-Specific Protected Routes */}

              <Route element={<ProtectedRoute allowedRoles={['STORE_ADMIN', 'SUPER_ADMIN']} />}>
                <Route element={<StoreAdminLayout />}>
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
                  <Route path="/store-admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/store-admin/purchasing/suppliers" element={<SuppliersPage />} />
                  <Route path="/store-admin/purchasing/purchases" element={<SupplierPurchasesListPage />} />
                  <Route path="/store-admin/purchasing/purchases/new" element={<NewSupplierPurchasePage />} />
                  <Route path="/store-admin/purchasing/opening-stock" element={<OpeningStockHistoryPage />} />
                  <Route path="/store-admin/purchasing/opening-stock/new" element={<OpeningStockPage />} />
                  <Route path="/store-admin/purchasing/purchases/:id" element={<SupplierPurchaseDetailPage />} />
                  <Route path="/store-admin/profile" element={<ProfilePage />} />

                  <Route path="/store-admin" element={<Navigate to="/store-admin/dashboard" replace />} />
                </Route>
              </Route>
              
              <Route element={<ProtectedRoute allowedRoles={['CASHIER', 'STORE_ADMIN', 'SUPER_ADMIN']} />}>
                <Route path="/cashier/*" element={<CashierDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ACCOUNTANT', 'STORE_ADMIN', 'SUPER_ADMIN']} />}>
                <Route path="/accountant/*" element={<AccountantDashboard />} />
              </Route>

              {/* Legacy Admin Redirects */}
              <Route path="/admin/*" element={<Navigate to="/super-admin/dashboard" replace />} />

              {/* New Super Admin Panel (Production SaaS) */}
              <Route element={<SuperAdminLayout />}>
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/stores" element={<StoresListPage />} />
                <Route path="/super-admin/stores/create" element={<CreateStorePage />} />
                <Route path="/super-admin/stores/edit/:id" element={<EditStorePage />} />
                <Route path="/super-admin/stores/:id" element={<StoreDetailsPage />} />
                <Route path="/super-admin/stores/:id/users" element={<StoreDetailsPage />} />
                <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
                <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
                <Route path="/super-admin/profile" element={<ProfilePage />} />
                <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
              </Route>

              {/* Intelligent Redirect Handling */}
              <Route path="/" element={<HomeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App;
