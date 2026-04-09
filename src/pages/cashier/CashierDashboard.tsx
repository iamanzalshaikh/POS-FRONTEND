import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingCart, Scan, Package, RotateCcw, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SidebarLink from '../../components/ui/SidebarLink';
import DeviceAccessGate from '../../components/cashier/DeviceAccessGate';
import POSInterface from './POSInterface';
import ShiftTools from './ShiftTools';
import DeviceSelection from './DeviceSelection';
import ReceiptPage from './ReceiptPage';
import ShiftSummaryPage from './ShiftSummaryPage';
import InventoryCheckPage from './InventoryCheckPage';
import CashierProfilePage from './CashierProfilePage';
import ProductsListPage from './ProductsListPage';
import ReturnRefundPage from './ReturnRefundPage';
import OfflineSalesPage from './OfflineSalesPage';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useAuthStore } from '../../store/useAuthStore';

const CashierDashboard: React.FC = () => {
  const { deviceId } = useDeviceStore();
  const { user } = useAuthStore();
  const terminal = user?.assignedTerminals?.[0];
  const displayTerminalId = terminal?.id ?? null;
  const displayTerminalName = terminal?.deviceName ?? null;

  const sidebar = (
    <>
      <div className="p-6 border-b border-slate-100/50 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#262255] rounded-xl flex items-center justify-center shadow-indigo-100 shadow-xl border border-indigo-500/20 flex-shrink-0">
            <Scan size={24} className="text-white" />
          </div>
          <div className="sidebar-header-text whitespace-nowrap overflow-hidden">
            <div className="text-xl font-extrabold text-white tracking-tight leading-none" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>Hybrid POS</div>
            <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">CASHIER</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {!deviceId && (
          <SidebarLink
            to="/cashier/devices"
            icon={<Scan size={20} />}
            label="Select Device"
            variant="navy"
          />
        )}
        <SidebarLink
          to="/cashier/terminal"
          icon={<ShoppingCart size={20} />}
          label="POS Terminal"
          variant="navy"
        />
        <SidebarLink
          to="/cashier/offline-sales"
          icon={<Clock size={20} />}
          label="Offline Sales"
          variant="navy"
        />
        <SidebarLink
          to="/cashier/returns"
          icon={<RotateCcw size={20} />}
          label="Returns / Refunds"
          variant="navy"
        />
        <SidebarLink
          to="/cashier/products"
          icon={<Package size={20} />}
          label="Products"
          variant="navy"
        />
        <SidebarLink
          to="/cashier/inventory"
          icon={<Package size={20} />}
          label="Inventory Check"
          variant="navy"
        />
      </nav>
    </>
  );

  return (
    <DeviceAccessGate>
      <DashboardLayout
        sidebarContent={sidebar}
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
          <Route path="/terminal" element={<><POSInterface /><ShiftTools /></>} />
          <Route path="/offline-sales" element={<OfflineSalesPage />} />
          <Route path="/products" element={<ProductsListPage />} />
          <Route path="/receipt/:saleId" element={<ReceiptPage />} />
          <Route path="/receipt/offline/:saleId" element={<ReceiptPage />} />
          <Route path="/shift-summary" element={<ShiftSummaryPage />} />
          <Route path="/inventory" element={<InventoryCheckPage />} />
          <Route path="/profile" element={<CashierProfilePage />} />
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
