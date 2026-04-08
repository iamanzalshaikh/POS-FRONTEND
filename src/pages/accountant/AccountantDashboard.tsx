import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BarChart3, PieChart, FileText, Download, Calculator } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import SidebarLink from '../../components/ui/SidebarLink';
import StatCard from '../../components/ui/StatCard';
import FinancialOverview from './FinancialOverview';
import ExpenseTracker from './ExpenseTracker';
import ExpensesPage from './ExpensesPage';
import TaxManagement from './TaxManagement';
import ProfitLossReport from './ProfitLossReport';
import ExportData from './ExportData';
import MonthlyCloseReport from './MonthlyCloseReport';
import AllTransactions from './AllTransactions';

const AccountantDashboard: React.FC = () => {
  const sidebar = (
    <>
      <div className="flex items-center space-x-3 mb-10 pl-1 mt-2">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/30 flex-shrink-0">
          <Calculator size={24} className="text-white" />
        </div>
        <div className="sidebar-header-text whitespace-nowrap overflow-hidden">
          <div className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent tracking-tight leading-none">
            Accountant
          </div>
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Financial</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarLink to="/accountant" icon={<BarChart3 size={20} />} label="Summary" variant="amber" />
        <SidebarLink to="/accountant/expenses" icon={<Calculator size={20} />} label="Expenses" variant="amber" />
        <SidebarLink to="/accountant/tax" icon={<FileText size={20} />} label="Tax" variant="amber" />
        <SidebarLink to="/accountant/pl" icon={<PieChart size={20} />} label="P&L" variant="amber" />
        <SidebarLink to="/accountant/monthly-close" icon={<FileText size={20} />} label="Monthly Close" variant="amber" />
        <SidebarLink to="/accountant/export" icon={<Download size={20} />} label="Export" variant="amber" />
      </nav>
    </>
  );

  return (
    <DashboardLayout
      sidebarContent={sidebar}
      title="Financial Controller"
      subtitle="Review ledger, expenses and financial health"
      role="ACCOUNTANT"
      accentColor="amber"
    >
      <Routes>
        <Route path="/" element={
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
              <StatCard title="Total Revenue" value="$84,210" change="+12.5%" variant="amber" />
              <StatCard title="Total Expenses" value="$32,450" change="-5.2%" variant="amber" />
              <StatCard title="Net Profit" value="$51,760" change="+18.3%" variant="amber" />
              <StatCard title="Tax Liability" value="$8,421" change="Estimated" variant="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <FinancialOverview />
              <ExpenseTracker />
            </div>
          </>
        } />
        <Route path="/expenses" element={<ExpensesPage />} />
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
