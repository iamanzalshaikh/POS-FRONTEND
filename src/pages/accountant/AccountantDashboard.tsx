import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, Download, Calculator, FileSpreadsheet, TrendingUp, DollarSign, Users, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MetricCard from '../../components/global-components/MetricCard';
import { getSalesReport } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import FinancialOverview from './FinancialOverview';
import ExpenseTracker from './ExpenseTracker';
import ExpensesPage from './ExpensesPage';
import ExpenseReport from './ExpenseReport';
import TaxManagement from './TaxManagement';
import ProfitLossReport from './ProfitLossReport';
import ExportData from './ExportData';
import MonthlyCloseReport from './MonthlyCloseReport';
import AllTransactions from './AllTransactions';
import StaffManagementPage from './StaffManagementPage';
import PayrollManagementPage from './PayrollManagementPage';
import PageHeader from '../../components/global-components/PageHeader';
import { formatCurrency } from '@/utils/format';

const AccountantDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    taxLiability: 0,
    revenueChange: 0,
    expensesChange: 0,
    profitChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [salesResponse, expensesResponse] = await Promise.all([
        getSalesReport({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }),
        getExpenses()
      ]);

      if (salesResponse.success && expensesResponse.success) {
        const totalRevenue = (salesResponse.data as any)?.summary?.totalRevenue || 0;
        const totalExpenses = expensesResponse.data.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const taxLiability = totalRevenue * 0.18;

        setDashboardData({
          totalRevenue,
          totalExpenses,
          netProfit,
          taxLiability,
          revenueChange: 12.5,
          expensesChange: -5.2,
          profitChange: 18.3,
        });
      }
    } catch (error) {
      console.error('[AccountantDashboard] Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const accountantMenu = [
    { name: 'Summary', icon: BarChart3, path: '/accountant' },
    { name: 'Expenses', icon: Calculator, path: '/accountant/expenses' },
    { name: 'Expense Report', icon: FileSpreadsheet, path: '/accountant/expense-report' },
    { name: 'Staff', icon: Users, path: '/accountant/staff' },
    { name: 'Payroll', icon: Wallet, path: '/accountant/payroll' },
    { name: 'Tax', icon: FileText, path: '/accountant/tax' },
    { name: 'P&L', icon: PieChart, path: '/accountant/pl' },
    { name: 'Monthly Close', icon: FileText, path: '/accountant/monthly-close' },
    { name: 'Export', icon: Download, path: '/accountant/export' },
  ];

  return (
    <DashboardLayout
      menuItems={accountantMenu}
      title="Financial Controller"
      subtitle="Review ledger, expenses and financial health"
      role="ACCOUNTANT"
      accentColor="indigo"
    >
      <Routes>
        <Route path="/" element={
          <div className="animate-fade-in space-y-10">
            <PageHeader
               title="Financial Overview"
               description="Real-time financial analytics and business health"
            />

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2rem]"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Revenue"
                  value={formatCurrency(dashboardData.totalRevenue)}
                  icon={DollarSign}
                  colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                />
                <MetricCard
                  title="Expenses"
                  value={formatCurrency(dashboardData.totalExpenses)}
                  icon={Calculator}
                  colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                />
                <MetricCard
                  title="Net Profit"
                  value={formatCurrency(dashboardData.netProfit)}
                  icon={TrendingUp}
                  colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                />
                <MetricCard
                  title="Tax Liability"
                  value={formatCurrency(dashboardData.taxLiability)}
                  icon={FileText}
                  colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                />
              </div>
            )}

            <div className="space-y-8 mt-10">
              <FinancialOverview />
              <ExpenseTracker />
            </div>
          </div>
        } />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expense-report" element={<ExpenseReport />} />
        <Route path="/staff" element={<StaffManagementPage />} />
        <Route path="/payroll" element={<PayrollManagementPage />} />
        <Route path="/transactions" element={<AllTransactions />} />
        <Route path="/tax" element={<TaxManagement />} />
        <Route path="/pl" element={<ProfitLossReport />} />
        <Route path="/monthly-close" element={<MonthlyCloseReport />} />
        <Route path="/export" element={<ExportData />} />
        <Route path="*" element={<Navigate to="/accountant" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
