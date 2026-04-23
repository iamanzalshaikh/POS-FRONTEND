import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PieChart,
  FileText,
  Download,
  FileSpreadsheet,
  Calculator,
  Users,
  Wallet,
  Truck,
  ClipboardList,
  ListOrdered,
  User,
  ShieldCheck,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getFinanceSummary, getSalesReport } from '../../api/finance.api';
import type { FinanceSummaryData } from '../../api/finance.api';
import { toLocalYMD } from '@/utils/format';
import ExpenseTracker from './ExpenseTracker';
import AccountantDashboardHome, { type AccountantPeriodPreset } from './AccountantDashboardHome';
import ExpensesPage from './ExpensesPage';
import ExpenseReport from './ExpenseReport';
import TaxManagement from './TaxManagement';
import ProfitLossReport from './ProfitLossReport';
import ExportData from './ExportData';
import MonthlyCloseReport from './MonthlyCloseReport';
import AllTransactions from './AllTransactions';
import AccountantAuditLogsPage from './AccountantAuditLogsPage';
import ReceiptPage from '../cashier/ReceiptPage';
import StaffSalaryReceipt from './StaffSalaryReceipt';
import StaffManagementPage from './StaffManagementPage';
import StaffDetail from './StaffDetail';
import PayrollManagementPage from './PayrollManagementPage';
import SuppliersPage from '@/pages/store-admin/purchasing/SuppliersPage';
import SupplierPurchasesListPage from '@/pages/store-admin/purchasing/SupplierPurchasesListPage';
import NewSupplierPurchasePage from '@/pages/store-admin/purchasing/NewSupplierPurchasePage';
const SupplierPurchaseDetailPage = React.lazy(() => import('@/pages/store-admin/purchasing/SupplierPurchaseDetailPage'));
const OpeningStockPage = React.lazy(() => import('@/pages/store-admin/purchasing/OpeningStockPage'));
const OpeningStockHistoryPage = React.lazy(() => import('@/pages/store-admin/purchasing/OpeningStockHistoryPage'));
const ProfilePage = React.lazy(() => import('@/pages/shared/ProfilePage'));

/** Today = single day. Week = Monday–today (this week). Month = 1st of month–today. */
function getPeriodForPreset(preset: AccountantPeriodPreset): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = toLocalYMD(today);
  if (preset === 'today') {
    return { startDate: endDate, endDate };
  }
  if (preset === 'week') {
    const start = new Date(today);
    const dow = start.getDay();
    const daysFromMonday = dow === 0 ? 6 : dow - 1;
    start.setDate(start.getDate() - daysFromMonday);
    return { startDate: toLocalYMD(start), endDate };
  }
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: toLocalYMD(start), endDate };
}

const AccountantDashboard: React.FC = () => {
  const accountantMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/accountant' },
    {
      name: 'Purchasing',
      icon: Truck,
      path: '/accountant/purchasing/suppliers',
      children: [
        { name: 'Suppliers', icon: Truck, path: '/accountant/purchasing/suppliers' },
        { name: 'Purchases', icon: ClipboardList, path: '/accountant/purchasing/purchases' },
        { name: 'New Purchase', icon: ClipboardList, path: '/accountant/purchasing/purchases/new' },
        { name: 'Opening Stock', icon: LayoutDashboard, path: '/accountant/purchasing/opening-stock' },
      ],
    },
    { name: 'Ledger', icon: ListOrdered, path: '/accountant/transactions' },
    { name: 'Expenses', icon: Calculator, path: '/accountant/expenses' },
    { name: 'Expense Report', icon: FileSpreadsheet, path: '/accountant/expense-report' },
    { name: 'Staff', icon: Users, path: '/accountant/staff' },
    { name: 'Payroll', icon: Wallet, path: '/accountant/payroll' },
    { name: 'P&L', icon: PieChart, path: '/accountant/pl' },
    { name: 'Monthly Close', icon: FileText, path: '/accountant/monthly-close' },
    { name: 'Audit Logs', icon: ShieldCheck, path: '/accountant/audit-logs' },
    { name: 'Export', icon: Download, path: '/accountant/export' },
  ];

  return (
    <DashboardLayout
      menuItems={accountantMenu}
      title="Financial Controller"
      subtitle=""
      role="ACCOUNTANT"
      accentColor="indigo"
    >
      {/* Paths are relative to parent /accountant/* — absolute /accountant/... here breaks matching in RR6/7 */}
      <Routes>
        <Route
          index
          element={
            <div className="animate-fade-in space-y-8">
              <AccountantDashboardHome />

              <div className="space-y-8">
                <ExpenseTracker />
              </div>
            </div>  
          }
        />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expense-report" element={<ExpenseReport />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="payroll" element={<PayrollManagementPage />} />
        <Route path="transactions" element={<AllTransactions />} />
        <Route path="transaction/:saleId" element={<ReceiptPage />} />
        <Route path="payroll/receipt/:payrollId" element={<StaffSalaryReceipt />} />
        <Route path="purchasing/suppliers" element={<SuppliersPage />} />
        <Route path="purchasing/purchases/new" element={<NewSupplierPurchasePage />} />
        <Route path="purchasing/purchases/:id" element={<SupplierPurchaseDetailPage />} />
        <Route path="purchasing/purchases" element={<SupplierPurchasesListPage />} />
        <Route path="purchasing/opening-stock" element={<OpeningStockHistoryPage />} />
        <Route path="purchasing/opening-stock/new" element={<OpeningStockPage />} />
        <Route path="tax" element={<TaxManagement />} />
        <Route path="pl" element={<ProfitLossReport />} />
        <Route path="monthly-close" element={<MonthlyCloseReport />} />
        <Route path="audit-logs" element={<AccountantAuditLogsPage />} />
        <Route path="export" element={<ExportData />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/accountant" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
