import React, { useEffect, useState } from 'react';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { getSalesReport, getSalesTransactions } from '../../api/finance.api';

interface TaxItem {
  id: string;
  type: string;
  rate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  invoiceNumber?: string;
}

const TaxManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [taxItems, setTaxItems] = useState<TaxItem[]>([]);
  const [totalLiability, setTotalLiability] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        setLoading(true);

        // Get the last 30 days of sales to calculate tax
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        console.log('🧾 [TaxManagement] Fetching tax data...');
        const response = await getSalesReport({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });

        console.log('🧾 [TaxManagement] API Response:', response);

        if (response && 'success' in response && response.success) {
          const reportData = response.data as any;
          const totalTax = reportData?.summary?.totalTax || 0;

          console.log('🧾 [TaxManagement] Total Tax:', totalTax);

          // Mock tax breakdown based on total tax collected
          // In a real system, you'd have separate tax tables
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

          setTaxItems(taxData);
          setTotalLiability(totalTax);
          setTotalPaid(gstAmount);
          setTotalOverdue(tdsAmount > 100 ? tdsAmount : 0);
        } else if (response && 'success' in response && !response.success) {
          console.error('🧾 [TaxManagement] API returned error:', response);
          setError((response as any).message || 'Failed to load tax data');
        }
      } catch (err: any) {
        console.error('Failed to fetch tax data:', err);
        setError(err.message || 'Failed to load tax data');
      } finally {
        setLoading(false);
      }
    };

    fetchTaxData();
  }, []);

  const getStatusStyles = (status: TaxItem['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const handleExportReport = () => {
    if (taxItems.length === 0) {
      alert('No tax data available to export');
      return;
    }

    // Create CSV content
    const headers = ['Tax Type', 'Rate', 'Amount', 'Due Date', 'Status'];
    const csvData = taxItems.map(item => [
      item.type,
      item.rate,
      item.amount.toFixed(2),
      item.dueDate,
      item.status
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add summary section
    const summaryContent = `\n\nSummary\nTotal Liability,${totalLiability.toFixed(2)}\nTotal Paid,${totalPaid.toFixed(2)}\nTotal Overdue,${totalOverdue.toFixed(2)}\nGenerated Date,${new Date().toLocaleDateString()}`;
    
    const finalCSV = csvContent + summaryContent;

    // Create blob and download
    const blob = new Blob([finalCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tax-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('🧾 [TaxManagement] Tax report exported successfully');
  };

  const handlePayTax = (taxId: string) => {
    alert(`Pay tax ${taxId} - Would open payment gateway`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm font-bold text-slate-500">Loading tax data...</div>
          </div>
        </div>
      </div>
    );
  }

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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <FileText size={24} className="text-amber-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Liability</span>
          </div>
          <div className="text-3xl font-black text-slate-900">₹{totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-500 font-black uppercase mt-2">Last 30 Days</div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={24} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Paid</span>
          </div>
          <div className="text-3xl font-black text-emerald-600">₹{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-500 font-black uppercase mt-2">
            {totalLiability > 0 ? ((totalPaid / totalLiability) * 100).toFixed(1) : 0}% Completed
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle size={24} className="text-red-400" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Overdue</span>
          </div>
          <div className="text-3xl font-black text-red-600">₹{totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-[10px] text-slate-500 font-black uppercase mt-2">Requires Action</div>
        </div>
      </div>

      {/* Tax Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Tax Breakdown</h2>
          <button
            onClick={handleExportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all"
          >
            <Download size={16} />
            <span>Export Report</span>
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Tax Type</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Rate</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Due Date</th>
              <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
              <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {taxItems.length > 0 ? (
              taxItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-slate-900">{item.type}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-black text-slate-600">{item.rate}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-black text-slate-900">₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase">{item.dueDate}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button
                      onClick={() => handlePayTax(item.id)}
                      className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-600 tracking-widest"
                      disabled={item.status === 'paid'}
                    >
                      {item.status === 'paid' ? 'Paid' : 'Pay Now'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-slate-400">
                  <p className="text-sm font-bold">No tax records found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tax Reminders */}
      {totalOverdue > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 mb-2">Upcoming Tax Deadlines</h3>
              <ul className="space-y-2">
                {taxItems.filter(t => t.status === 'pending' || t.status === 'overdue').map((item) => (
                  <li key={item.id} className="text-[10px] text-amber-800">
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
