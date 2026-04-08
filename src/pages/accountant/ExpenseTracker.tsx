import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Plus, ArrowUpRight, AlertCircle, XCircle, RotateCcw } from 'lucide-react';
import { getInventoryLogs, getSalesTransactions } from '../../api/finance.api';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'Inventory' | 'Refund' | 'Cancellation';
  status?: 'pending' | 'processed';
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  cancelledCount: number;
  cancelledAmount: number;
  refundedCount: number;
  refundedAmount: number;
}

const ExpenseTracker: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'refund' | 'cancellation' | 'inventory'>('all');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      console.log('💰 [ExpenseTracker] Fetching expenses...');
      
      // Fetch inventory adjustments and sales transactions
      const [inventoryLogsResponse, salesResponse] = await Promise.all([
        getInventoryLogs({ limit: 10, changeType: 'ADJUSTMENT' }),
        getSalesTransactions({ limit: 100 })
      ]);

      console.log('💰 [ExpenseTracker] Inventory Logs Response:', inventoryLogsResponse);
      console.log('💰 [ExpenseTracker] Sales Response:', salesResponse);

      const expenseList: Expense[] = [];
      let cancelledCount = 0;
      let cancelledAmount = 0;
      let refundedCount = 0;
      let refundedAmount = 0;
      let totalSales = 0;
      let totalRevenue = 0;

      // Process inventory logs as expenses
      if (inventoryLogsResponse.success && inventoryLogsResponse.data) {
        // Data can be either direct array or object with logs property
        const logs = Array.isArray(inventoryLogsResponse.data) 
          ? inventoryLogsResponse.data 
          : (inventoryLogsResponse.data as any).logs || [];
        
        console.log('💰 [ExpenseTracker] Found', logs.length, 'inventory logs');
        logs.forEach((log: any) => {
          expenseList.push({
            id: log.id,
            description: `${log.changeType} - ${log.product?.name || 'Inventory Adjustment'}`,
            amount: Math.abs(Number(log.quantityChange)) * 10, // Estimated cost
            date: new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            type: 'Inventory',
            status: 'processed'
          });
        });
      } else {
        console.warn('💰 [ExpenseTracker] No inventory logs data or failed response');
      }

      // Process sales for refunds and cancellations
      if (salesResponse.success && salesResponse.data) {
        // Data is a direct array from our normalized response
        const sales = Array.isArray(salesResponse.data) 
          ? salesResponse.data 
          : (salesResponse.data as any);
        
        console.log('💰 [ExpenseTracker] Found', sales.length, 'sales');

        sales.forEach(sale => {
          totalSales += 1;
          totalRevenue += Number(sale.totalAmount);

          if (sale.isCancelled) {
            cancelledCount += 1;
            cancelledAmount += Number(sale.totalAmount);
            expenseList.push({
              id: sale.id,
              description: `Cancelled - Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type: 'Cancellation',
              status: 'processed'
            });
          } else if (sale.paymentStatus === 'REFUNDED') {
            refundedCount += 1;
            refundedAmount += Number(sale.totalAmount);
            expenseList.push({
              id: sale.id,
              description: `Refund - Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: new Date(sale.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              type: 'Refund',
              status: 'processed'
            });
          }
        });

        setSalesStats({
          totalSales,
          totalRevenue,
          cancelledCount,
          cancelledAmount,
          refundedCount,
          refundedAmount
        });
      } else {
        console.warn('💰 [ExpenseTracker] No sales data or failed response');
      }

      // Sort by date (most recent first)
      expenseList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('💰 [ExpenseTracker] Total expenses:', expenseList.length);
      setExpenses(expenseList.slice(0, 10)); // Show top 10
      setTotalExpenses(expenseList.reduce((sum, e) => sum + e.amount, 0));
    } catch (err: any) {
      console.error('Failed to fetch expenses:', err);
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    alert('Add expense functionality - Would open modal to record new expense');
  };

  const filteredExpenses = filterType === 'all' 
    ? expenses 
    : expenses.filter(e => e.type.toLowerCase() === filterType);

  if (loading) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-bold text-slate-500">Loading expenses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Calculator size={24} className="mr-3 text-amber-400" />
            Pending Expenses
          </h2>
        </div>
        <div className="text-center text-red-500 py-8">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales Stats Cards */}
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Calculator size={20} className="text-emerald-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Total Sales</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{salesStats.totalSales}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(salesStats.totalRevenue)}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle size={20} className="text-red-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Cancelled</span>
            </div>
            <div className="text-2xl font-black text-red-600">{salesStats.cancelledCount}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(salesStats.cancelledAmount)}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <RotateCcw size={20} className="text-amber-400" />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Refunded</span>
            </div>
            <div className="text-2xl font-black text-amber-600">{salesStats.refundedCount}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(salesStats.refundedAmount)}
            </div>
          </div>
        </div>
      )}

      {/* Main Expense Tracker */}
      <div className="p-8 bg-white border border-slate-200 rounded-3xl overflow-hidden group">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <Calculator size={24} className="mr-3 text-amber-400" />
            Recent Transactions
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="refund">Refunds</option>
              <option value="cancellation">Cancellations</option>
              <option value="inventory">Inventory</option>
            </select>
            <button
              onClick={handleAddExpense}
              className="p-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    expense.type === 'Refund' ? 'bg-amber-50 text-amber-500' :
                    expense.type === 'Cancellation' ? 'bg-red-50 text-red-500' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {expense.type === 'Refund' ? <RotateCcw size={18} /> :
                     expense.type === 'Cancellation' ? <XCircle size={18} /> :
                     <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight text-slate-900">{expense.description}</div>
                    <div className="text-[10px] text-slate-500 font-black uppercase">
                      {expense.type} • {expense.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-black text-slate-900">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(expense.amount)}
                  </span>
                  <ArrowUpRight size={14} className="text-slate-400" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-bold">No transactions found</p>
            </div>
          )}
        </div>

        {totalExpenses > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Value</span>
              <span className="text-lg font-black text-amber-600">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalExpenses)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/accountant/transactions')}
          className="w-full mt-6 py-3 border border-slate-200 border-dashed rounded-2xl text-slate-500 text-xs font-black uppercase tracking-widest hover:border-amber-500/50 hover:text-amber-500 transition-all"
        >
          View All Transactions
        </button>
      </div>
    </div>
  );
};

export default ExpenseTracker;
