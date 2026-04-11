import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, XCircle, RotateCcw, Package, Search } from 'lucide-react';
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

        sales.forEach((sale: any) => {
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Transaction Ledger...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/accountant/expenses')}
            className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all group mb-8"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Return to Financial Hub</span>
          </button>
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Master Ledger</h1>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                Live Transaction Stream • Audit Mode
              </p>
            </div>
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/10 hidden md:block">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Total Records</p>
              <p className="text-lg font-black uppercase tracking-widest leading-none">{transactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-8 space-y-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                <ArrowUpRight size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Aggregate</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{transactions.length}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Historical Entries</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 rounded-2xl flex items-center justify-center text-rose-500">
                <XCircle size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-rose-400 tracking-widest">Cancelled</span>
            </div>
            <div className="text-3xl font-black text-rose-600 tabular-nums">
              {transactions.filter(t => t.type === 'Cancellation').length}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Purged Orders</div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center text-blue-500">
                <RotateCcw size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Refunded</span>
            </div>
            <div className="text-3xl font-black text-blue-600 tabular-nums">
              {transactions.filter(t => t.type === 'Refund').length}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Reversed Registry</div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                <Package size={20} />
             </div>
             <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Filter Registry</h2>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="w-full md:w-[240px] px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">View All Stream</option>
            <option value="refund">Refund Entries</option>
            <option value="cancellation">Cancellation Log</option>
            <option value="inventory">Inventory Shifts</option>
          </select>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
                      transaction.type === 'Refund' ? 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50' :
                      transaction.type === 'Cancellation' ? 'bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50' :
                      'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800'
                    }`}>
                      {transaction.type === 'Refund' ? <RotateCcw size={24} /> :
                       transaction.type === 'Cancellation' ? <XCircle size={24} /> :
                       <Package size={24} />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                        {transaction.description}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-md border ${
                          transaction.type === 'Refund' ? 'border-blue-200 text-blue-500' :
                          transaction.type === 'Cancellation' ? 'border-rose-200 text-rose-500' :
                          'border-slate-200 text-slate-400'
                        }`}>
                          {transaction.type}
                        </span>
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Value</p>
                      <span className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tighter tabular-nums">
                        Rs. {transaction.amount.toLocaleString('en-PK', { 
                          minimumFractionDigits: 0, 
                          maximumFractionDigits: 0 
                        })}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:border-blue-500 transition-all active:scale-95">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-6">
                 <Search size={32} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry Result: Null</p>
            </div>
          )}
        </div>

        {/* Total Ledger Summary */}
        {transactions.length > 0 && (
          <div className="bg-slate-900 dark:bg-blue-600 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-500/10 flex flex-col md:flex-row justify-between items-center group overflow-hidden relative">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase text-white/50 tracking-[4px]">Aggregated Ledger Value</span>
              <h3 className="text-white text-sm font-black uppercase tracking-widest mt-2">Combined Financial Impact</h3>
            </div>
            <div className="relative z-10 mt-6 md:mt-0 text-right">
              <span className="text-4xl font-black text-white uppercase tracking-tighter tabular-nums">
                Rs. {totalAmount.toLocaleString('en-PK', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">Certified Audit Total</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
