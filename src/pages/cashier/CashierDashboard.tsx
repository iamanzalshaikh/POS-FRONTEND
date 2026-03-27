import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ShoppingCart, Scan, Package, RotateCcw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SidebarLink from '../../components/ui/SidebarLink';
import DeviceAccessGate from '../../components/cashier/DeviceAccessGate';
import DeviceStatusIndicator from '../../components/cashier/DeviceStatusIndicator';
import POSInterface from './POSInterface';
import ShiftTools from './ShiftTools';
import DeviceSelection from './DeviceSelection';
import ReceiptPage from './ReceiptPage';
import ShiftSummaryPage from './ShiftSummaryPage';
import InventoryCheckPage from './InventoryCheckPage';
import CashierProfilePage from './CashierProfilePage';
import ProductsListPage from './ProductsListPage';
import ReturnRefundPage from './ReturnRefundPage';
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
      <div className="flex items-center space-x-3 mb-10 pl-1 mt-2">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/30 flex-shrink-0">
          <Scan size={24} className="text-white" />
        </div>
        <div className="sidebar-header-text whitespace-nowrap overflow-hidden">
          <div className="font-extrabold text-xl tracking-tight text-slate-800 leading-none">QUICK-POS</div>
          <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Cashier Pro</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {!deviceId && (
          <SidebarLink
            to="/cashier/devices"
            icon={<Scan size={20} />}
            label="Select Device"
            variant="emerald"
          />
        )}
        <SidebarLink
          to="/cashier/terminal"
          icon={<ShoppingCart size={20} />}
          label="POS Terminal"
          variant="emerald"
        />
        <SidebarLink
          to="/cashier/returns"
          icon={<RotateCcw size={20} />}
          label="Returns / Refunds"
          variant="emerald"
        />
        <SidebarLink
          to="/cashier/products"
          icon={<Package size={20} />}
          label="Products"
          variant="emerald"
        />
        <SidebarLink
          to="/cashier/inventory"
          icon={<Package size={20} />}
          label="Inventory Check"
          variant="emerald"
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
        headerExtra={<DeviceStatusIndicator deviceId={displayTerminalId} deviceName={displayTerminalName} />}
      >
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/cashier/terminal" replace />}
          />
          <Route path="/devices" element={deviceId ? <Navigate to="/cashier/terminal" replace /> : <DeviceSelection />} />
          <Route path="/terminal" element={<><POSInterface /><ShiftTools /></>} />
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
