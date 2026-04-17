import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingCart, Scan, Package, RotateCcw, Clock, History, User } from 'lucide-react';
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
import { useDeviceStore } from '../../store/useDeviceStore';
import { useAuthStore } from '../../store/useAuthStore';
import * as devicesApi from '../../api/devices.api';

const CashierDashboard: React.FC = () => {
  const { deviceId } = useDeviceStore();
  const { user } = useAuthStore();

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
    { name: 'Offline Sales', icon: Clock, path: '/cashier/offline-sales' },
    { name: 'Returns / Refunds', icon: RotateCcw, path: '/cashier/returns' },
    { name: 'Products', icon: Package, path: '/cashier/products' },
    { name: 'Inventory Check', icon: Package, path: '/cashier/inventory' },
  ];

  return (
    <DeviceAccessGate>
      <DashboardLayout
        menuItems={cashierMenu}
        title="POS Terminal"
        subtitle="Complete sales and manage your active shift"
        role="CASHIER"
        accentColor="emerald"
      >
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/cashier/terminal" replace />}
          />
          <Route path="/devices" element={deviceId ? <Navigate to="/cashier/terminal" replace /> : <DeviceSelection />} />
          <Route path="/terminal" element={<POSInterface />} />
          <Route path="/sales" element={<SalesHistoryPage />} />
          <Route path="/offline-sales" element={<OfflineSalesPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/receipt/:saleId" element={<ReceiptPage />} />
          <Route path="/receipt/offline/:saleId" element={<ReceiptPage />} />
          <Route path="/shift-summary" element={<ShiftSummaryPage />} />
          <Route path="/inventory" element={<InventoryCheckPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/returns" element={<ReturnRefundPage />} />
          <Route
            path="/scan"
            element={
              <div className="text-center p-20 bg-white border border-slate-200 rounded-3xl">
                <Scan size={64} className="mx-auto text-emerald-500 mb-6" />
                <h2 className="text-2xl font-bold text-slate-800">Scan Item Ready</h2>
                <p className="text-slate-500 mt-2">Waiting for barcode input...</p>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/cashier" replace />} />
        </Routes>
      </DashboardLayout>
    </DeviceAccessGate>
  );
};

export default CashierDashboard;
