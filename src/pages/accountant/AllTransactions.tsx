import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, XCircle, RotateCcw, Package } from 'lucide-react';
import { getInventoryLogs, getSalesTransactions } from '../../api/finance.api';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'Inventory' | 'Refund' | 'Cancellation';
  status: 'processed';
}

const AllTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'refund' | 'cancellation' | 'inventory'>('all');

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      
      const [inventoryLogsResponse, salesResponse] = await Promise.all([
        getInventoryLogs({ limit: 1000, changeType: 'ADJUSTMENT' }),
        getSalesTransactions({ limit: 1000 })
      ]);

      const transactionList: Transaction[] = [];

      // Process inventory logs
      if (inventoryLogsResponse.success && inventoryLogsResponse.data) {
        const logs = Array.isArray(inventoryLogsResponse.data) 
          ? inventoryLogsResponse.data 
          : (inventoryLogsResponse.data as any).logs || [];
        
        logs.forEach((log: any) => {
          transactionList.push({
            id: log.id,
            description: `${log.changeType} - ${log.product?.name || 'Inventory Adjustment'}`,
            amount: Math.abs(Number(log.quantityChange)) * 10,
            date: new Date(log.createdAt).toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            type: 'Inventory',
            status: 'processed'
          });
        });
      }

      // Process sales for refunds and cancellations
      if (salesResponse.success && salesResponse.data) {
        const sales = Array.isArray(salesResponse.data) 
          ? salesResponse.data 
          : (salesResponse.data as any);

        sales.forEach(sale => {
          if (sale.isCancelled) {
            transactionList.push({
              id: sale.id,
              description: `Cancelled - Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: new Date(sale.createdAt).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'Cancellation',
              status: 'processed'
            });
          } else if (sale.paymentStatus === 'REFUNDED') {
            transactionList.push({
              id: sale.id,
              description: `Refund - Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: new Date(sale.createdAt).toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'Refund',
              status: 'processed'
            });
          }
        });
      }

      // Sort by date (most recent first)
      transactionList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(transactionList);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type.toLowerCase() === filterType);

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-bold text-slate-500">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/accountant/expenses')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors group mb-4"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to Expenses</span>
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">All Transactions</h1>
          <p className="text-slate-500 font-medium mt-2">
            Complete history of refunds, cancellations, and inventory adjustments
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <ArrowUpRight size={20} className="text-slate-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{transactions.length}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">transactions</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle size={20} className="text-red-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cancelled</span>
            </div>
            <div className="text-2xl font-black text-red-600">
              {transactions.filter(t => t.type === 'Cancellation').length}
            </div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">orders</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <RotateCcw size={20} className="text-amber-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Refunded</span>
            </div>
            <div className="text-2xl font-black text-amber-600">
              {transactions.filter(t => t.type === 'Refund').length}
            </div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">orders</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Transactions</h2>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="refund">Refunds</option>
              <option value="cancellation">Cancellations</option>
              <option value="inventory">Inventory</option>
            </select>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      transaction.type === 'Refund' ? 'bg-amber-50 text-amber-500' :
                      transaction.type === 'Cancellation' ? 'bg-red-50 text-red-500' :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {transaction.type === 'Refund' ? <RotateCcw size={20} /> :
                       transaction.type === 'Cancellation' ? <XCircle size={20} /> :
                       <Package size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{transaction.description}</div>
                      <div className="text-xs font-black text-slate-500 uppercase mt-1">
                        {transaction.type} • {transaction.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-slate-900 text-lg">
                      ₹{transaction.amount.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm font-bold">No transactions found</p>
            </div>
          )}
        </div>

        {/* Total */}
        {transactions.length > 0 && (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black uppercase text-slate-500 tracking-widest">Total Value</span>
              <span className="text-2xl font-black text-amber-600">
                ₹{totalAmount.toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
