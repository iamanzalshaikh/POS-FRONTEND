import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, Download, Calculator, FileSpreadsheet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Users, Wallet } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SidebarLink from '../../components/ui/SidebarLink';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const sidebar = (
    <>
      <div className="p-6 border-b border-slate-100/50 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#262255] rounded-xl flex items-center justify-center shadow-indigo-100 shadow-xl border border-indigo-500/20 flex-shrink-0">
            <Calculator size={24} className="text-white" />
          </div>
          <div className="sidebar-header-text whitespace-nowrap overflow-hidden">
            <div className="text-xl font-extrabold text-white tracking-tight leading-none" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>Hybrid POS</div>
            <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">ACCOUNTANT</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarLink to="/accountant" icon={<BarChart3 size={20} />} label="Summary" variant="navy" />
        <SidebarLink to="/accountant/expenses" icon={<Calculator size={20} />} label="Expenses" variant="navy" />
        <SidebarLink to="/accountant/expense-report" icon={<FileSpreadsheet size={20} />} label="Expense Report" variant="navy" />
        <SidebarLink to="/accountant/staff" icon={<Users size={20} />} label="Staff" variant="navy" />
        <SidebarLink to="/accountant/payroll" icon={<Wallet size={20} />} label="Payroll" variant="navy" />
        <SidebarLink to="/accountant/tax" icon={<FileText size={20} />} label="Tax" variant="navy" />
        <SidebarLink to="/accountant/pl" icon={<PieChart size={20} />} label="P&L" variant="navy" />
        <SidebarLink to="/accountant/monthly-close" icon={<FileText size={20} />} label="Monthly Close" variant="navy" />
        <SidebarLink to="/accountant/export" icon={<Download size={20} />} label="Export" variant="navy" />
      </nav>
    </>
  );

  const MetricCard = ({ title, value, change, isPositive, icon: Icon }: { title: string; value: string; change: string; isPositive: boolean; icon: React.ComponentType<any> }) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-[#2563EB]/10 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50/50 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-[#1E1B4B]">
            <Icon size={18} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
            <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:translate-x-1 transition-transform">{value}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {isPositive ? <ArrowUpRight size={10} className="text-emerald-600" /> : <ArrowDownRight size={10} className="text-rose-600" />}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      sidebarContent={sidebar}
      title="Financial Controller"
      subtitle="Review ledger, expenses and financial health"
      role="ACCOUNTANT"
      accentColor="indigo"
    >
      <Routes>
        <Route path="/" element={
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
                <MetricCard
                  title="Revenue"
                  value={formatCurrency(dashboardData.totalRevenue)}
                  change={`+${dashboardData.revenueChange}`}
                  isPositive={true}
                  icon={DollarSign}
                />
                <MetricCard
                  title="Expenses"
                  value={formatCurrency(dashboardData.totalExpenses)}
                  change={`${dashboardData.expensesChange > 0 ? '+' : ''}${dashboardData.expensesChange}`}
                  isPositive={dashboardData.expensesChange > 0}
                  icon={DollarSign}
                />
                <MetricCard
                  title="Net Profit"
                  value={formatCurrency(dashboardData.netProfit)}
                  change={`+${dashboardData.profitChange}`}
                  isPositive={true}
                  icon={TrendingUp}
                />
                <MetricCard
                  title="Tax Liability"
                  value={formatCurrency(dashboardData.taxLiability)}
                  change="0"
                  isPositive={true}
                  icon={FileText}
                />
              </div>
            )}

            <div className="space-y-8">
              <FinancialOverview />
              <ExpenseTracker />
            </div>
          </>
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
