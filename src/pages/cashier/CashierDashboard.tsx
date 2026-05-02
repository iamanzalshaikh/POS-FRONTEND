import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Scan, Package, RotateCcw, Clock, History, User, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import DeviceAccessGate from '../../components/cashier/DeviceAccessGate';
import POSInterface from './POSInterface';
import DeviceSelection from './DeviceSelection';
import ReceiptPage from './ReceiptPage';
import ShiftSummaryPage from './ShiftSummaryPage';
import InventoryCheckPage from './InventoryCheckPage';
const ProfilePage = React.lazy(() => import('@/pages/shared/ProfilePage'));
import ProductsListPage from './ProductsListPage';
import ReturnRefundPage from './ReturnRefundPage';
import OfflineSalesPage from './OfflineSalesPage';
import SalesHistoryPage from './SalesHistoryPage';
import CashierAuditLogsPage from './CashierAuditLogsPage';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useAuthStore } from '../../store/useAuthStore';
import * as devicesApi from '../../api/devices.api';

const CashierDashboard: React.FC = () => {
  const { deviceId } = useDeviceStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const isTerminal = location.pathname === '/cashier/terminal';

  // Integrated Automated Status Sync (Heartbeat)
  // Periodically notifies the backend that this terminal is active
  React.useEffect(() => {
    if (!deviceId) return;

    // Pulse with a small delay on mount to avoid competing with critical product fetch
    const initialPulse = setTimeout(() => {
      devicesApi.heartbeat(deviceId).catch(err => console.error("[HEARTBEAT] Initial Pulse Failure:", err));
    }, 500);

    const interval = setInterval(() => {
      devicesApi.heartbeat(deviceId).catch(err => {
        console.error("[HEARTBEAT] Sync Failure:", err);
      });
    }, 60000); // 1 minute interval

    return () => {
      clearTimeout(initialPulse);
      clearInterval(interval);
    };
  }, [deviceId]);
  const terminal = user?.assignedTerminals?.[0];
  const displayTerminalId = terminal?.id ?? null;
  const displayTerminalName = terminal?.deviceName ?? null;

  const cashierMenu = [
    ...(deviceId ? [] : [{ name: 'Select Device', icon: Scan, path: '/cashier/devices' }]),
    { name: 'POS Terminal', icon: ShoppingCart, path: '/cashier/terminal' },
    { name: 'Sale History', icon: History, path: '/cashier/sales' },
    // { name: 'Offline Sales', icon: Clock, path: '/cashier/offline-sales' },
    { name: 'Returns / Refunds', icon: RotateCcw, path: '/cashier/returns' },
    { name: 'Products', icon: Package, path: '/cashier/products' },
    // { name: 'Inventory Check', icon: Package, path: '/cashier/inventory' },
    { name: 'Audit Logs', icon: ShieldCheck, path: '/cashier/audit-logs' },
  ];

  return (
    <DashboardLayout
      menuItems={cashierMenu}
      title="Cashier Portal"
      subtitle={isTerminal ? "" : "Complete sales and manage your daily operations"}
      role="CASHIER"
      accentColor="emerald"
      noPadding={isTerminal}
    >
      <Routes>
        <Route path="/terminal" element={
          <DeviceAccessGate>
            <POSInterface />
          </DeviceAccessGate>
        } />
        <Route path="/sales" element={<SalesHistoryPage />} />
        <Route path="/audit-logs" element={<CashierAuditLogsPage />} />
        {/* <Route path="/offline-sales" element={<OfflineSalesPage />} /> */}
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/returns" element={<ReturnRefundPage />} />
        <Route path="/inventory" element={<InventoryCheckPage />} />
        <Route path="/shift-summary" element={<ShiftSummaryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/receipt/:saleId" element={<ReceiptPage />} />
        {/* <Route path="/receipt/offline/:saleId" element={<ReceiptPage />} /> */}
        
        <Route path="/devices" element={<DeviceSelection />} />
        
        <Route
          path="/"
          element={<Navigate to="/cashier/terminal" replace />}
        />
        <Route path="*" element={<Navigate to="/cashier" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default CashierDashboard;
