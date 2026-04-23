import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { getSalesReport } from '../../api/finance.api';
import MetricCard from '../../components/global-components/MetricCard';
import PageHeader from '../../components/global-components/PageHeader';
import { DataTable } from '../../components/global-components/data-table-2';
import { formatAmount } from '@/utils/format';
import type { ColumnDef } from '@tanstack/react-table';
import { ManagementPageSkeleton } from '@/components/ui/skeletons/ManagementPageSkeleton';
import { exportToExcel } from '../../utils/excel-export';

interface TaxItem {
  id: string;
  type: string;
  rate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
}

const TaxManagement: React.FC = () => {
  // Queries
  const { data: salesRes, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['accountant-tax-sales-report'],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      return getSalesReport({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const { taxItems, totalLiability, totalPaid, totalOverdue } = useMemo(() => {
    if (!salesRes?.success) {
      return { taxItems: [], totalLiability: 0, totalPaid: 0, totalOverdue: 0 };
    }

    const reportData = salesRes.data as any;
    const totalTax = reportData?.summary?.totalTax || 0;

    // Mock tax breakdown based on total tax collected
    const gstAmount = totalTax * 0.75; // 75% is GST
    const incomeTaxAmount = totalTax * 0.20; // 20% is income tax
    const tdsAmount = totalTax * 0.05; // 5% is TDS

    const taxData: TaxItem[] = [
      {
        id: '1',
        type: 'GST (18%)',
        rate: '18%',
        amount: gstAmount,
        status: gstAmount > 0 ? 'paid' : 'pending',
        dueDate: new Date(new Date().setDate(15)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      {
        id: '2',
        type: 'Income Tax',
        rate: '30%',
        amount: incomeTaxAmount,
        status: 'pending',
        dueDate: new Date(new Date().setDate(30)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      },
      {
        id: '3',
        type: 'TDS',
        rate: '10%',
        amount: tdsAmount,
        status: tdsAmount > 100 ? 'overdue' : 'pending',
        dueDate: new Date(new Date().setDate(1)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    ];

    return {
      taxItems: taxData,
      totalLiability: totalTax,
      totalPaid: gstAmount,
      totalOverdue: tdsAmount > 100 ? tdsAmount : 0
    };
  }, [salesRes]);

  const error = queryError ? (queryError as any).message : (salesRes?.success === false ? salesRes.message : null);

  const handleExportReport = () => {
    if (taxItems.length === 0) {
      alert('No tax data available to export');
      return;
    }

    const rows = taxItems.map(item => ({
      'Tax Type': item.type,
      'Rate': item.rate,
      'Amount (PKR)': Number(item.amount),
      'Due Date': item.dueDate,
      'Status': item.status.toUpperCase()
    }));

    // Add summary row
    rows.push({
      'Tax Type': 'TOTAL SUMMARY',
      'Rate': '—',
      'Amount (PKR)': Number(totalLiability),
      'Due Date': '—',
      'Status': 'GROSS'
    });
    
    exportToExcel(rows, `Tax-Report-${new Date().toISOString().split('T')[0]}`, 'Taxation Summary');
    
    console.log('🧾 [TaxManagement] Tax report exported successfully');
  };

  if (loading) return <ManagementPageSkeleton cards={3} columns={4} />;

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tax Management"
        description="Monitor and manage business tax liabilities"
        icon={FileText}
        primaryAction={{
          label: "Export XLS Report",
          icon: Download,
          onClick: handleExportReport
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Liability"
          value={formatAmount(totalLiability)}
          icon={FileText}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Paid Taxes"
          value={formatAmount(totalPaid)}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Overdue Taxes"
          value={formatAmount(totalOverdue)}
          icon={AlertCircle}
          colorClass="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
        />
      </div>

      {/* Tax Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <TaxTable taxItems={taxItems} onExport={handleExportReport} onRefresh={refetch} />
      </div>

      {/* Tax Reminders */}
      {totalOverdue > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle size={24} className="text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-blue-900 mb-2">Upcoming Tax Deadlines</h3>
              <ul className="space-y-2">
                {taxItems.filter(t => t.status === 'pending' || t.status === 'overdue').map((item) => (
                  <li key={item.id} className="text-[10px] text-blue-800">
                    <span className="font-black uppercase">{item.type}</span> - {item.status === 'overdue' ? 'Overdue since' : 'Due on'} {item.dueDate}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxManagement;

// Tax DataTable Component
const TaxTable: React.FC<{ taxItems: TaxItem[]; onExport: () => void; onRefresh: () => void }> = ({ taxItems, onExport, onRefresh }) => {
  const handlePayTax = (taxId: string) => {
    alert(`Pay tax ${taxId} - Would open payment gateway`);
  };

  const getStatusStyles = (status: TaxItem['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const columns: ColumnDef<TaxItem>[] = [
    {
      header: "Tax Type",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.type}
        </div>
      )
    },
    {
      header: "Rate",
      cell: ({ row }) => (
        <div className="text-center text-slate-600 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.rate}
        </div>
      )
    },
    {
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatAmount(row.original.amount)}
        </div>
      )
    },
    {
      header: "Due Date",
      cell: ({ row }) => (
        <div className="text-center text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.dueDate}
        </div>
      )
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyles(row.original.status)}`}>
            {row.original.status}
          </span>
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePayTax(row.original.id)}
            className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 tracking-widest"
            disabled={row.original.status === 'paid'}
          >
            {row.original.status === 'paid' ? 'Paid' : 'Pay Now'}
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={taxItems}
      onExport={() => onExport()}
      onRefresh={onRefresh}
      placeholder="Search tax records..."
      hidePagination={false}
    />
  );
};
