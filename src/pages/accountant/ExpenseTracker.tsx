import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, XCircle, RotateCcw, Calculator, Package, ArrowUpDown } from 'lucide-react';
import { getInventoryLogs, getSalesTransactions } from '../../api/finance.api';
import { getExpenses } from '../../api/expenses.api';
import type { Expense as ExpenseType } from '../../utils/expense-utils';

interface Transaction {
  id: string;
  invoiceNumber?: string;
  description: string;
  amount: number;
  date: string;
  dateRaw: Date;
  type: 'Sale' | 'Refund' | 'Cancellation' | 'Inventory' | 'Business Expense';
  status: 'completed' | 'pending' | 'processed';
  paymentMethod?: string;
}

type SortField = 'date' | 'amount' | 'type' | 'description';
type SortDirection = 'asc' | 'desc';

const ExpenseTracker: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const [inventoryLogsResponse, salesResponse, expensesResponse] = await Promise.all([
        getInventoryLogs({ limit: 100, changeType: 'ADJUSTMENT' }),
        getSalesTransactions({ limit: 200 }),
        getExpenses()
      ]);

      const transactionList: Transaction[] = [];

      // Process sales transactions
      if (salesResponse.success && salesResponse.data) {
        const sales = Array.isArray(salesResponse.data)
          ? salesResponse.data
          : (salesResponse.data as any);

        sales.forEach((sale: any) => {
          const dateRaw = new Date(sale.createdAt);
          if (sale.isCancelled) {
            transactionList.push({
              id: sale.id,
              invoiceNumber: sale.invoiceNumber,
              description: `Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: dateRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              dateRaw,
              type: 'Cancellation',
              status: 'completed',
              paymentMethod: sale.paymentMethod
            });
          } else if (sale.paymentStatus === 'REFUNDED' || sale.paymentStatus === 'REFUND') {
            transactionList.push({
              id: sale.id,
              invoiceNumber: sale.invoiceNumber,
              description: `Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: dateRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              dateRaw,
              type: 'Refund',
              status: 'completed',
              paymentMethod: sale.paymentMethod
            });
          } else {
            transactionList.push({
              id: sale.id,
              invoiceNumber: sale.invoiceNumber,
              description: `Invoice #${sale.invoiceNumber}`,
              amount: Number(sale.totalAmount),
              date: dateRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              dateRaw,
              type: 'Sale',
              status: 'completed',
              paymentMethod: sale.paymentMethod
            });
          }
        });
      }

      // Process inventory logs
      if (inventoryLogsResponse.success && inventoryLogsResponse.data) {
        const logs = Array.isArray(inventoryLogsResponse.data)
          ? inventoryLogsResponse.data
          : (inventoryLogsResponse.data as any).logs || [];

        logs.forEach((log: any) => {
          const dateRaw = new Date(log.createdAt);
          transactionList.push({
            id: log.id,
            description: `${log.changeType} - ${log.product?.name || 'Inventory Adjustment'}`,
            amount: Math.abs(Number(log.quantityChange)) * 10,
            date: dateRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dateRaw,
            type: 'Inventory',
            status: 'processed'
          });
        });
      }

      // Process business expenses
      if (expensesResponse.success && expensesResponse.data) {
        const businessExpenses = expensesResponse.data as ExpenseType[];

        businessExpenses.forEach(expense => {
          const dateRaw = new Date(expense.date);
          transactionList.push({
            id: expense.id,
            description: `${expense.category} - ${expense.description}`,
            amount: expense.amount,
            date: dateRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            dateRaw,
            type: 'Business Expense',
            status: 'processed'
          });
        });
      }

      transactionList.sort((a, b) => b.dateRaw.getTime() - a.dateRaw.getTime());
      setTransactions(transactionList);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.invoiceNumber?.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.paymentMethod?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = a.dateRaw.getTime() - b.dateRaw.getTime();
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'description':
          cmp = a.description.localeCompare(b.description);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, searchQuery, filterType, filterStatus, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const paginatedItems = filteredAndSorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalAmount = filteredAndSorted.reduce((sum, t) => sum + t.amount, 0);
  const saleCount = filteredAndSorted.filter(t => t.type === 'Sale').length;
  const refundCount = filteredAndSorted.filter(t => t.type === 'Refund').length;
  const cancelCount = filteredAndSorted.filter(t => t.type === 'Cancellation').length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Sale': return <ArrowUpRight size={16} className="text-emerald-500" />;
      case 'Refund': return <RotateCcw size={16} className="text-amber-500" />;
      case 'Cancellation': return <XCircle size={16} className="text-rose-500" />;
      case 'Inventory': return <Package size={16} className="text-slate-400" />;
      case 'Business Expense': return <Calculator size={16} className="text-blue-500" />;
    }
  };

  const getTypeBadgeClass = (type: Transaction['type']) => {
    switch (type) {
      case 'Sale': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Refund': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Cancellation': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'Inventory': return 'bg-slate-50 text-slate-600 border-slate-100';
      case 'Business Expense': return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm group transition-all duration-500 hover:shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Recent Transactions</h3>
            <p className="text-xs text-slate-500 font-medium font-bold uppercase tracking-widest mt-1">Sales, refunds & expenses</p>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-sm shadow-blue-50/50">
            <span className="text-[10px] font-black uppercase tracking-widest">{filteredAndSorted.length} records</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice, description, type..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="Sale">Sales</option>
            <option value="Refund">Refunds</option>
            <option value="Cancellation">Cancellations</option>
            <option value="Inventory">Inventory</option>
            <option value="Business Expense">Expenses</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('description')}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-slate-900 transition-colors"
                >
                  Description
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-slate-900 transition-colors"
                >
                  Type
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-left px-6 py-3">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-slate-900 transition-colors"
                >
                  Date
                  <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="text-right px-6 py-3">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center gap-1 justify-end text-[10px] font-black uppercase text-slate-500 tracking-widest hover:text-slate-900 transition-colors ml-auto"
                >
                  Amount
                  <ArrowUpDown size={12} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  onClick={() => tx.invoiceNumber && navigate(`/accountant/transactions`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50">
                        {getTypeIcon(tx.type)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 tracking-tight">{tx.description}</div>
                        {tx.paymentMethod && (
                          <div className="text-[10px] text-slate-400 font-medium">{tx.paymentMethod}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getTypeBadgeClass(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-600">{tx.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-slate-900 tabular-nums">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <p className="text-sm font-bold text-slate-400">No transactions found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-black text-slate-900">{paginatedItems.length}</span> of{' '}
          <span className="font-black text-slate-900">{filteredAndSorted.length}</span> transactions
          {totalAmount > 0 && (
            <span className="ml-3">
              Total: <span className="font-black text-slate-900">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalAmount)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-black text-slate-500 w-16 text-center">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 border-t border-slate-100 divide-x divide-slate-100">
        <div className="p-4 text-center">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Sales</div>
          <div className="text-lg font-black text-emerald-600 mt-1">{saleCount}</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Refunds</div>
          <div className="text-lg font-black text-amber-600 mt-1">{refundCount}</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Cancelled</div>
          <div className="text-lg font-black text-rose-600 mt-1">{cancelCount}</div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
