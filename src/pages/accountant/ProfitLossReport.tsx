import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, DollarSign, ArrowDownRight, Loader2, Search, Download } from 'lucide-react';
import { getProfitAndLoss } from '../../api/finance.api';
import { formatCurrency } from '../../utils/expense-utils';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ProfitLossReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('90days');
  const [tableRows, setTableRows] = useState<Array<{
    id: string;
    item: string;
    category: string;
    amount: number;
    percentage: number;
    status: 'revenue' | 'cost' | 'expense';
  }>>([]);

  useEffect(() => {
    fetchPNLData();
  }, [periodFilter]);

  const getPeriodDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (periodFilter) {
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '60days':
        startDate.setDate(startDate.getDate() - 60);
        break;
      case '90days':
      default:
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const fetchPNLData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getPeriodDates();

      const pnlRes = await getProfitAndLoss({ startDate, endDate });

      if (pnlRes.success && pnlRes.data) {
        setData(pnlRes.data);
        
        // Build table data
        const rows: typeof tableRows = [
          {
            id: 'revenue',
            item: 'Gross Revenue',
            category: 'Revenue',
            amount: pnlRes.data.revenue,
            percentage: 100,
            status: 'revenue'
          },
          {
            id: 'cogs',
            item: 'Cost of Goods Sold (COGS)',
            category: 'Direct Costs',
            amount: pnlRes.data.cogs,
            percentage: (pnlRes.data.cogs / pnlRes.data.revenue) * 100,
            status: 'cost'
          },
          {
            id: 'gross-profit',
            item: 'Gross Profit',
            category: 'Profit',
            amount: pnlRes.data.grossProfit,
            percentage: pnlRes.data.grossMargin,
            status: 'revenue'
          },
          {
            id: 'opex',
            item: 'Operating Expenses',
            category: 'Operating',
            amount: pnlRes.data.operatingExpenses,
            percentage: (pnlRes.data.operatingExpenses / pnlRes.data.revenue) * 100,
            status: 'expense'
          },
          {
            id: 'salaries',
            item: 'Salaries & Payroll',
            category: 'Operating',
            amount: pnlRes.data.salaries,
            percentage: (pnlRes.data.salaries / pnlRes.data.revenue) * 100,
            status: 'expense'
          },
          {
            id: 'net-profit',
            item: 'Net Profit',
            category: 'Bottom Line',
            amount: pnlRes.data.netProfit,
            percentage: pnlRes.data.netMargin,
            status: pnlRes.data.netProfit >= 0 ? 'revenue' : 'cost'
          }
        ];

        setTableRows(rows);
        setError(null);
      } else {
        setError(pnlRes.message || 'Failed to load P&L data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load P&L data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const filteredRows = tableRows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return row.item.toLowerCase().includes(q) || row.category.toLowerCase().includes(q);
  });

  const totalRevenue = data.revenue;
  const grossProfit = data.grossProfit;
  const netProfit = data.netProfit;

  const columns: ColumnDef<typeof tableRows[0]>[] = [
    {
      header: "Line Item",
      cell: ({ row }) => (
        <div className="text-left">
          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{row.original.item}</p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{row.original.category}</p>
        </div>
      )
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(row.original.amount)}
        </div>
      )
    },
    {
      header: "% of Revenue",
      cell: ({ row }) => (
        <div className="text-center text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest tabular-nums">
          {row.original.percentage.toFixed(1)}%
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => {
        const statusConfig = {
          'revenue': { text: 'Revenue', bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-700 dark:text-emerald-400', icon: '+' },
          'cost': { text: 'Cost', bg: 'bg-red-50 dark:bg-red-950/30', color: 'text-red-700 dark:text-red-400', icon: '−' },
          'expense': { text: 'Expense', bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-700 dark:text-amber-400', icon: '−' }
        };
        const config = statusConfig[row.original.status];
        
        return (
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color}`}>
              <span>{config.icon}</span>
              {config.text}
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Profit & Loss Statement"
        description="Financial performance analysis"
        primaryAction={{
          label: "Export Report",
          icon: Download,
          onClick: () => {
            // Export functionality
          }
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Gross Revenue"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(totalRevenue).replace('PKR', 'Rs').trim()}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Gross Profit"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(grossProfit).replace('PKR', 'Rs').trim()}
          icon={TrendingUp}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Net Profit"
          value={new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(netProfit).replace('PKR', 'Rs').trim()}
          icon={PieChart}
          colorClass={netProfit >= 0 ? "bg-slate-900 text-white dark:bg-slate-800" : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"}
        />
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search line items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Period Filter */}
          <div className="flex gap-3 items-center justify-start md:justify-end">
            {['30days', '60days', '90days'].map((period) => (
              <button
                key={period}
                onClick={() => setPeriodFilter(period)}
                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                  periodFilter === period
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {period === '30days' ? '30D' : period === '60days' ? '60D' : '90D'}
              </button>
            ))}
          </div>
        </div>
      </div>



      {/* P&L Line Items Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatementSection
          title="Gross Revenue"
          amount={totalRevenue}
          color="text-emerald-600 dark:text-emerald-400"
          symbol="+ "
        />
        <StatementSection
          title="Cost of Goods Sold"
          amount={data.cogs}
          color="text-red-600 dark:text-red-400"
          symbol="− "
        />
        <StatementSection
          title="Gross Profit"
          amount={grossProfit}
          color="text-blue-600 dark:text-blue-400"
          symbol="= "
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatementSection
          title="Operating Expenses"
          amount={data.operatingExpenses}
          color="text-amber-600 dark:text-amber-400"
          symbol="− "
        />
        <StatementSection
          title="Salaries & Payroll"
          amount={data.salaries}
          color="text-amber-600 dark:text-amber-400"
          symbol="− "
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StatementSection
          title="Net Profit"
          amount={netProfit}
          color={netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
          symbol={netProfit >= 0 ? "+ " : "− "}
        />
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Margin Analysis</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Gross Margin</span>
              <span className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{data.grossMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Operating Expense Ratio</span>
              <span className="text-[12px] font-black text-red-600 dark:text-red-400 tabular-nums">{data.expenseRatio.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Net Margin</span>
              <span className={`text-[12px] font-black tabular-nums ${data.netMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{data.netMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Financial Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">COGS Ratio</span>
              <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">{data.revenue > 0 ? ((data.cogs / data.revenue) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Total Operating Costs</span>
              <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">Rs {new Intl.NumberFormat('en-IN', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(data.operatingExpenses + data.salaries)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Transactions Processed</span>
              <span className="text-[12px] font-black text-slate-900 dark:text-white tabular-nums">{data.metrics?.totalSales || 0} sales</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- Refined Internal Components --- */

const StatementSection = ({ title, amount, color, symbol, subtext, children, isList }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div className="max-w-[180px]">
        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">{title}</h4>
        {subtext && <p className="text-[9px] text-slate-400 italic leading-tight">{subtext}</p>}
      </div>
      <span className={`text-lg font-black ${color} tabular-nums`}>{symbol}{formatCurrency(amount)}</span>
    </div>
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-md">
      {!isList ? (
        <div className="flex justify-between items-center text-[12px]">
          <span className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest">Total Amount</span>
          <span className={`font-black ${color}`}>{formatCurrency(amount)}</span>
        </div>
      ) : children}
    </div>
  </div>
);

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900/30 rounded-full" />
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin absolute inset-0" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Ledger Vault...</p>
    </div>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen p-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="max-w-md w-full p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[2.5rem] text-center">
       <ArrowDownRight className="w-12 h-12 text-red-500 mx-auto mb-6 rotate-45" />
       <h3 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-widest mb-2">Vault Access Denied</h3>
       <p className="text-xs font-bold text-red-600 dark:text-red-800/70 uppercase tracking-tight">{message}</p>
    </div>
  </div>
);

export default ProfitLossReport;
