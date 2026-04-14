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
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getFinanceSummary, getSalesReport } from '../../api/finance.api';
import type { FinanceSummaryData } from '../../api/finance.api';
import ExpenseTracker from './ExpenseTracker';
import AccountantDashboardHome, { type AccountantPeriodPreset } from './AccountantDashboardHome';
import ExpensesPage from './ExpensesPage';
import ExpenseReport from './ExpenseReport';
import TaxManagement from './TaxManagement';
import ProfitLossReport from './ProfitLossReport';
import ExportData from './ExportData';
import MonthlyCloseReport from './MonthlyCloseReport';
import AllTransactions from './AllTransactions';
import StaffManagementPage from './StaffManagementPage';
import PayrollManagementPage from './PayrollManagementPage';
import SuppliersPage from '@/pages/store-admin/purchasing/SuppliersPage';
import SupplierPurchasesListPage from '@/pages/store-admin/purchasing/SupplierPurchasesListPage';
import NewSupplierPurchasePage from '@/pages/store-admin/purchasing/NewSupplierPurchasePage';
import SupplierPurchaseDetailPage from '@/pages/store-admin/purchasing/SupplierPurchaseDetailPage';

function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const [periodPreset, setPeriodPreset] = useState<AccountantPeriodPreset>('month');
  const [summary, setSummary] = useState<FinanceSummaryData | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<Array<{ label: string; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const { startDate, endDate } = getPeriodForPreset(periodPreset);
    try {
      setLoading(true);
      const [summaryRes, salesRes] = await Promise.all([
        getFinanceSummary({ startDate, endDate }),
        getSalesReport({ startDate, endDate }),
      ]);

      if (summaryRes.success && 'data' in summaryRes && summaryRes.data) {
        setSummary(summaryRes.data);
      } else {
        setSummary(null);
      }

      if (salesRes.success && 'data' in salesRes && salesRes.data?.data?.length) {
        setDailyRevenue(
          salesRes.data.data.map((r) => ({
            label: new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            revenue: r.revenue,
          }))
        );
      } else {
        setDailyRevenue([]);
      }
    } catch (error) {
      console.error('[AccountantDashboard] Failed to fetch dashboard data:', error);
      setSummary(null);
      setDailyRevenue([]);
    } finally {
      setLoading(false);
    }
  }, [periodPreset]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const accountantMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/accountant' },
    {
      name: 'Purchasing',
      icon: Truck,
      path: '/accountant/purchasing/suppliers',
      children: [
        { name: 'Suppliers', icon: Truck, path: '/accountant/purchasing/suppliers' },
        { name: 'Purchases', icon: ClipboardList, path: '/accountant/purchasing/purchases' },
      ],
    },
    { name: 'Ledger', icon: ListOrdered, path: '/accountant/transactions' },
    { name: 'Expenses', icon: Calculator, path: '/accountant/expenses' },
    { name: 'Expense Report', icon: FileSpreadsheet, path: '/accountant/expense-report' },
    { name: 'Staff', icon: Users, path: '/accountant/staff' },
    { name: 'Payroll', icon: Wallet, path: '/accountant/payroll' },
    // Temporarily disabled - can be re-enabled by uncommenting
    // { name: 'Tax', icon: FileText, path: '/accountant/tax' },
    { name: 'P&L', icon: PieChart, path: '/accountant/pl' },
    { name: 'Monthly Close', icon: FileText, path: '/accountant/monthly-close' },
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
            <div className="animate-fade-in space-y-10">
              <AccountantDashboardHome
                summary={summary}
                dailyRevenue={dailyRevenue}
                loading={loading}
                periodPreset={periodPreset}
                onPeriodPresetChange={setPeriodPreset}
              />

              <div className="space-y-8 mt-10">
                <ExpenseTracker />
              </div>
            </div>  
          }
        />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expense-report" element={<ExpenseReport />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="payroll" element={<PayrollManagementPage />} />
        <Route path="transactions" element={<AllTransactions />} />
        <Route path="purchasing/suppliers" element={<SuppliersPage />} />
        <Route path="purchasing/purchases/new" element={<NewSupplierPurchasePage />} />
        <Route path="purchasing/purchases/:id" element={<SupplierPurchaseDetailPage />} />
        <Route path="purchasing/purchases" element={<SupplierPurchasesListPage />} />
        <Route path="tax" element={<TaxManagement />} />
        <Route path="pl" element={<ProfitLossReport />} />
        <Route path="monthly-close" element={<MonthlyCloseReport />} />
        <Route path="export" element={<ExportData />} />
        <Route path="*" element={<Navigate to="/accountant" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
