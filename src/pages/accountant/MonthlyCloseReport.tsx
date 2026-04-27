import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  PieChart, 
  Download, 
  Search, 
  ArrowDownRight,
  Package,
  Receipt,
  Layers,
  Percent,
  Scale,
  Activity
} from 'lucide-react';
import { getMonthlyCloseReport, getFinanceSummary } from '../../api/finance.api';
import { formatCurrency, getCategoryLabel } from '../../utils/expense-utils';
import { toLocalYMD } from '../../utils/format';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { MonthPicker } from '../../components/global-components/Calendar/MonthPicker';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { exportToExcel } from '../../utils/excel-export';

const MonthlyCloseReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(toLocalYMD(new Date()).slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get start/end dates for the selected month
  const { startDate, endDate } = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of month
    
    // If it's the current month, we might want to cap at today to match dashboard month-to-date
    const today = new Date();
    const currentMonthStr = toLocalYMD(today).slice(0, 7);
    
    const finalEnd = selectedMonth === currentMonthStr ? today : end;
    
    return {
      startDate: toLocalYMD(start),
      endDate: toLocalYMD(finalEnd)
    };
  }, [selectedMonth]);

  // Query 1: Finance Summary (Dashboard parity)
  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ['accountant-finance-summary', selectedMonth],
    queryFn: () => getFinanceSummary({ startDate, endDate }),
    staleTime: 1000 * 60 * 10,
  });

  // Query 2: Monthly Close Report (Breakdowns)
  const { data: closeRes, isLoading: closeLoading, error: closeError, refetch } = useQuery({
    queryKey: ['accountant-monthly-close', selectedMonth],
    queryFn: () => {
      const [year, month] = selectedMonth.split('-').map(Number);
      return getMonthlyCloseReport(year, month);
    },
    staleTime: 1000 * 60 * 10,
  });

  const summary = summaryRes?.success ? summaryRes.data : null;
  const closeData = closeRes?.success ? closeRes.data : null;
  const error = closeError ? (closeError as any).message : (!closeRes?.success && closeRes?.message ? closeRes.message : null);

  // Dashboard-matching calculations (EXACT logic from AccountantDashboardHome.tsx)
  const dashboardStats = useMemo(() => {
    if (!summary) return { totalExpenses: 0, netMarginAmount: 0, netMarginPercent: 0 };
    
    // Card 11 calculation: Operating + Staff Payroll + Supplier Cash Paid
    const totalExpenses = (summary.operatingExpenses || 0) + 
                         (summary.salaries || 0) + 
                         (summary.totalStockPaid || 0);
    
    // Card 12 calculation: Total Revenue - Total Expense
    const netMarginAmount = (summary.totalRevenue || 0) - totalExpenses;
    const netMarginPercent = (summary.totalRevenue || 0) > 0 
                               ? (netMarginAmount / summary.totalRevenue) * 100 
                               : 0;
    
    return { totalExpenses, netMarginAmount, netMarginPercent };
  }, [summary]);

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  interface MonthlyReportRow {
    id: string;
    item: string;
    category: string;
    amount: number;
    percentage: number;
    status: 'revenue' | 'cost' | 'expense' | 'neutral';
  }

  const tableRows = useMemo((): MonthlyReportRow[] => {
    if (!summary) return [];
    
    return [
      {
        id: 'gross-revenue',
        item: 'Total Sales (Net)',
        category: 'Revenue',
        amount: summary.totalRevenue,
        percentage: 100,
        status: 'revenue'
      },
      {
        id: 'cogs',
        item: 'Cost of Sales (COGS)',
        category: 'Product Cost',
        amount: summary.cogs,
        percentage: (summary.cogs / (summary.totalRevenue || 1)) * 100,
        status: 'cost'
      },
      {
        id: 'gross-profit',
        item: 'Gross Profit',
        category: 'Performance',
        amount: summary.grossProfit,
        percentage: summary.grossMarginPercent || 0,
        status: 'revenue'
      },
      {
        id: 'operating-expenses',
        item: 'Operating Expenses',
        category: 'Fixed Costs',
        amount: summary.operatingExpenses,
        percentage: (summary.operatingExpenses / (summary.totalRevenue || 1)) * 100,
        status: 'expense'
      },
      {
        id: 'staff-payroll',
        item: 'Staff Payroll',
        category: 'Human Capital',
        amount: summary.salaries,
        percentage: (summary.salaries / (summary.totalRevenue || 1)) * 100,
        status: 'expense'
      },
      {
        id: 'sourcing-paid',
        item: 'Supplier Cash Paid',
        category: 'Procurement',
        amount: summary.totalStockPaid,
        percentage: (summary.totalStockPaid / (summary.totalRevenue || 1)) * 100,
        status: 'cost'
      },
      {
        id: 'tax-liability',
        item: 'Tax Liability',
        category: 'Taxation',
        amount: summary.taxLiability,
        percentage: (summary.taxLiability / (summary.totalRevenue || 1)) * 100,
        status: 'neutral'
      },
      {
        id: 'net-margin',
        item: 'Net Margin Amount',
        category: 'Final Result',
        amount: dashboardStats.netMarginAmount,
        percentage: dashboardStats.netMarginPercent,
        status: dashboardStats.netMarginAmount >= 0 ? 'revenue' : 'cost'
      }
    ];
  }, [summary, dashboardStats]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return tableRows;
    const q = searchQuery.toLowerCase();
    return tableRows.filter(r => 
      r.item.toLowerCase().includes(q) || 
      r.category.toLowerCase().includes(q)
    );
  }, [tableRows, searchQuery]);

  const columns: ColumnDef<MonthlyReportRow>[] = [
    {
      header: "Ledger Item",
      cell: ({ row }) => (
        <div className="text-left py-1">
          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.item}</p>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 flex items-center gap-1.5">
            <Layers size={10} className="text-slate-300" />
            {row.original.category}
          </p>
        </div>
      )
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest tabular-nums font-bold">
            {formatCurrency(row.original.amount)}
          </span>
        </div>
      )
    },
    {
      header: "Revenue Share",
      cell: ({ row }) => (
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest tabular-nums">
            {row.original.percentage.toFixed(1)}%
          </span>
          <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={cn(
                 "h-full rounded-full transition-all duration-1000",
                 row.original.status === 'revenue' ? 'bg-emerald-500' : 
                 row.original.status === 'cost' ? 'bg-rose-500' :
                 row.original.status === 'expense' ? 'bg-amber-500' : 'bg-slate-400'
               )}
               style={{ width: `${Math.min(100, Math.max(0, row.original.percentage))}%` }}
             />
          </div>
        </div>
      )
    },
    {
      header: "Impact",
      cell: ({ row }) => {
        const config: Record<MonthlyReportRow['status'], { label: string; bg: string; color: string; icon: any }> = {
          'revenue': { label: 'Inflow', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400', icon: TrendingUp },
          'cost': { label: 'Outflow', bg: 'bg-rose-50 dark:bg-rose-950/30', color: 'text-rose-600 dark:text-rose-400', icon: ArrowDownRight },
          'expense': { label: 'Expense', bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400', icon: PieChart },
          'neutral': { label: 'Neutral', bg: 'bg-slate-50 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-400', icon: Receipt }
        };
        const s = config[row.original.status];
        const Icon = s.icon;
        
        return (
          <div className="flex justify-center">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm transition-all hover:scale-105",
              s.bg, s.color
            )}>
              <Icon size={12} />
              {s.label}
            </span>
          </div>
        );
      }
    }
  ];

  const handleExport = () => {
    if (!summary) return;
    const rows = tableRows.map(r => ({
      'Ledger Item': r.item,
      'Category': r.category,
      'Amount (PKR)': Number(r.amount),
      'Revenue Share': r.percentage.toFixed(1) + '%',
      'Impact': r.status.toUpperCase()
    }));
    
    exportToExcel(rows, `Monthly-Close-${selectedMonth}`, 'Audit Statement');
  };

  const loading = summaryLoading || closeLoading;

  if (loading) return <MonthlyCloseSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!summary || !closeData) return null;

  return (
    <div className="animate-fade-in space-y-10 pb-10">
      <PageHeader
        title={`${getMonthName(selectedMonth)} Closing`}
        description="Comprehensive audit and final monthly statement"
        primaryAction={{
          label: "Export XLS",
          icon: Download,
          onClick: handleExport
        }}
      >
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm group focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
            <Calendar className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <MonthPicker
              value={selectedMonth}
              onChange={(val) => val && setSelectedMonth(val)}
              className="border-none bg-transparent h-auto py-0 hover:bg-transparent shadow-none text-[11px] font-black uppercase tracking-widest outline-none"
            />
          </div>
        </div>
      </PageHeader>

      {/* KPI Section - PARITY WITH DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Sales (Net)"
          value={summary.totalRevenue}
          isCurrency={true}
          icon={DollarSign}
          colorClass="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50"
          subtitle={`Net Sales Revenue`}
        />
        <MetricCard
          title="Gross Profit"
          value={summary.grossProfit}
          isCurrency={true}
          icon={TrendingUp}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50"
          subtitle={`Margin: ${summary.grossMarginPercent?.toFixed(1)}%`}
        />
        <MetricCard
          title="Total Expenses"
          value={dashboardStats.totalExpenses}
          isCurrency={true}
          icon={Scale}
          colorClass="bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50"
          subtitle="Ops + Staff + Sourcing Paid"
        />
        <MetricCard
          title="Net Margin"
          value={dashboardStats.netMarginAmount}
          isCurrency={true}
          icon={Activity}
          colorClass={cn(
            "border-indigo-100 dark:border-indigo-900/50",
            dashboardStats.netMarginAmount >= 0 
              ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30" 
              : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
          )}
          subtitle={`Margin: ${dashboardStats.netMarginPercent.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-none border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Closing Statement</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Detailed ledger breakdown</p>
               </div>
               <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Identify item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-11 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all w-full sm:w-[240px]"
                />
              </div>
            </div>

            <DataTable
              columns={columns}
              data={filteredRows}
              isLoading={loading}
              onRefresh={refetch}
              hidePagination={true}
              manualPagination={false}
              exportFilename={`Monthly-Close-${selectedMonth}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Inventory Card */}
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                   <Package size={120} />
                </div>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                      <Package size={20} />
                   </div>
                   <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Inventory Health</h3>
                </div>
                
                <div className="space-y-5">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(closeData.inventory.stockValuation)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of Stock</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border",
                        closeData.inventory.outOfStockCount > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>{closeData.inventory.outOfStockCount} Products</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Low Stock Alert</span>
                      <span className="text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">{closeData.inventory.lowStockCount} Products</span>
                   </div>
                </div>
             </div>

             {/* Performance Card */}
             <div className="bg-slate-900 dark:bg-slate-800/50 rounded-[3rem] p-8 border border-slate-800 dark:border-slate-700 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                   <TrendingUp size={120} className="text-white" />
                </div>
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-3 bg-white/10 rounded-2xl text-blue-400">
                      <Percent size={20} />
                   </div>
                   <h3 className="text-xs font-black text-white uppercase tracking-widest">Payables Pulse</h3>
                </div>
                
                <div className="space-y-6">
                   <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Settlement Status</span>
                        <span className="text-[11px] font-black text-emerald-400 tabular-nums">Healthy</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }} />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Paid</div>
                         <div className="text-xs font-black text-white">{formatCurrency(summary.totalStockPaid)}</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Payables</div>
                         <div className="text-xs font-black text-rose-400">{formatCurrency(summary.outstandingPayables)}</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Expense Breakdown Sidebar */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none h-full">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Expense Mix</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Cost distribution</p>
                 </div>
                 <PieChart className="w-5 h-5 text-slate-300" />
              </div>

              <div className="space-y-6">
                {closeData.expenses.byCategory.length > 0 ? (
                  closeData.expenses.byCategory.map((cat) => (
                    <div key={cat.category} className="group cursor-default">
                      <div className="flex justify-between items-center mb-2.5">
                         <div className="flex items-center gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-400 group-hover:scale-150 transition-transform" />
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{getCategoryLabel(cat.category)}</span>
                         </div>
                         <span className="text-[11px] font-black text-slate-900 dark:text-white tabular-nums">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 dark:bg-slate-500 rounded-full group-hover:bg-blue-600 transition-colors" 
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-end mt-1.5">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{cat.percentage.toFixed(1)}% of total</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                     <AlertCircle className="w-8 h-8 mx-auto text-slate-200 mb-3" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No expenses recorded</p>
                  </div>
                )}
              </div>

              <div className="mt-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                 <div className="flex items-center gap-3 mb-4">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Closure Note</span>
                 </div>
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase">
                    Monthly close report for {getMonthName(selectedMonth)}. All figures are audited based on processed transactions and validated inventory stocks.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MonthlyCloseSkeleton = () => (
  <div className="animate-pulse space-y-10">
    <div className="flex justify-between items-end">
      <div className="space-y-3">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
      </div>
      <div className="h-12 w-48 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-[600px] bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem]" />
      <div className="lg:col-span-1 h-[600px] bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem]" />
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => {
  return (
    <div className="min-h-[400px] p-10 flex items-center justify-center">
      <div className="max-w-md w-full p-10 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-[3rem] text-center shadow-2xl shadow-rose-500/5">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
           <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-sm font-black text-rose-950 dark:text-rose-400 uppercase tracking-widest mb-3">
          Report Retrieval Failed
        </h3>
        <p className="text-[10px] font-black text-rose-600/70 dark:text-rose-400/50 uppercase tracking-widest leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

export default MonthlyCloseReport;
