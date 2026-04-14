import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  RotateCcw,
  ShoppingCart,
  Eye,
  Search,
} from 'lucide-react';
import {
  getInventoryLogs,
  getRecentTransactions,
  type RecentFinanceTransaction,
} from '../../api/finance.api';
import { formatCurrency } from '@/utils/format';
import { getSaleGrandTotal } from '@/utils/saleAmounts';
import { DataTable } from '../../components/global-components/data-table-2';
import MetricCard from '../../components/global-components/MetricCard';
import type { ColumnDef } from '@tanstack/react-table';

type StreamFilter = 'all' | 'sale' | 'refund' | 'inventory';

interface TransactionRow {
  id: string;
  type: string;
  invoiceNumber: string;
  paymentMethod: string;
  lineItemCount: number;
  totalTax: number;
  cashier?: string;
  createdAt: string;
  total: number;
}

const AllTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<StreamFilter>('all');
  const [page, setPage] = useState(1);
  const [recentItems, setRecentItems] = useState<RecentFinanceTransaction[]>([]);
  const [recentMeta, setRecentMeta] = useState({ total: 0, totalPages: 0, limit: 10 });
  const [inventoryRows, setInventoryRows] = useState<
    Array<{
      id: string;
      description: string;
      amountLabel: string;
      dateLabel: string;
    }>
  >([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadRecent = useCallback(async () => {
    const res = await getRecentTransactions({
      type: filterType === 'inventory' ? 'all' : filterType,
      page,
      limit: 10,
      ...(dateFrom && dateTo ? { startDate: dateFrom, endDate: dateTo } : {}),
    });
    if (res.success && res.data) {
      setRecentItems(res.data.items || []);
      const p = res.data.pagination;
      setRecentMeta({
        total: p?.total ?? 0,
        totalPages: p?.totalPages ?? 0,
        limit: p?.limit ?? 10,
      });
    } else {
      setRecentItems([]);
      setRecentMeta({ total: 0, totalPages: 0, limit: 10 });
    }
  }, [filterType, page, dateFrom, dateTo]);

  const loadInventory = useCallback(async () => {
    const res = await getInventoryLogs({ limit: 100, changeType: 'ADJUSTMENT' });
    if (!res.success || !res.data) {
      setInventoryRows([]);
      return;
    }
    const logs = Array.isArray(res.data)
      ? res.data
      : (res.data as { logs?: unknown[] }).logs || [];
    type LogRow = {
      id: string;
      changeType?: string;
      quantityChange?: number | string;
      createdAt: string;
      product?: { name?: string };
    };
    setInventoryRows(
      (logs as LogRow[]).map((log) => ({
        id: log.id,
        description: `${log.changeType ?? 'ADJUSTMENT'} — ${log.product?.name || 'Inventory'}`,
        amountLabel: String(Math.abs(Number(log.quantityChange) || 0)),
        dateLabel: new Date(log.createdAt).toLocaleString(),
      }))
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (filterType === 'inventory') {
          await loadInventory();
          if (!cancelled) setRecentItems([]);
        } else {
          await loadRecent();
          if (!cancelled) setInventoryRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterType, page, loadRecent, loadInventory]);

  useEffect(() => {
    setPage(1);
  }, [filterType, dateFrom, dateTo]);

  const saleCount = recentItems.filter((r) => r.transactionType === 'SALE').length;
  const refundCount = recentItems.filter((r) => r.transactionType === 'REFUND').length;

  // Frontend search filter
  const filteredRecentItems = recentItems.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.cashier?.name?.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    );
  });

  const filteredInventoryRows = inventoryRows.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return row.description.toLowerCase().includes(q) || row.dateLabel.toLowerCase().includes(q);
  });

  const transactionColumns: ColumnDef<TransactionRow>[] = [
    {
      header: "Transaction",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700">
            {row.original.type === 'REFUND' ? (
              <RotateCcw size={20} className="text-blue-500" />
            ) : (
              <ShoppingCart size={20} className="text-emerald-600" />
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {row.original.type} · {row.original.invoiceNumber}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
              {new Date(row.original.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Payment",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-[9px] font-black uppercase tracking-[2px]">
            {row.original.paymentMethod}
          </span>
        </div>
      ),
    },
    {
      header: "Products",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.lineItemCount}
        </div>
      ),
    },
    {
      header: "Tax",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.totalTax > 0 ? formatCurrency(row.original.totalTax) : '—'}
        </div>
      ),
    },
    {
      header: "Cashier",
      cell: ({ row }) => (
        <div className="text-center text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest font-bold">
          {row.original.cashier || '—'}
        </div>
      ),
    },
    {
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      id: "actions",
      header: "View",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate(`/accountant/transaction/${row.original.id}`)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-all active:scale-90"
            title="View Receipt"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  const inventoryColumns: ColumnDef<{
    id: string;
    description: string;
    amountLabel: string;
    dateLabel: string;
  }>[] = [
    {
      header: "Description",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-black text-sm border border-slate-200 dark:border-slate-700">
            <Package size={20} className="text-slate-500" />
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {row.original.description}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-0.5">
              {row.original.dateLabel}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Quantity Change",
      cell: ({ row }) => (
        <div className="text-right text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-widest tabular-nums font-bold">
          {row.original.amountLabel}
        </div>
      ),
    },
  ];

  const tableData =
    filterType === 'inventory'
      ? filteredInventoryRows.map((row) => ({
          id: row.id,
          description: row.description,
          amountLabel: row.amountLabel,
          dateLabel: row.dateLabel,
        }))
      : filteredRecentItems.map((t) => {
          const shortInvoice = t.invoiceNumber.includes('-')
            ? t.invoiceNumber.substring(t.invoiceNumber.lastIndexOf('-') + 1)
            : t.invoiceNumber;

          return {
            id: t.id,
            type: t.transactionType,
            invoiceNumber: shortInvoice,
            paymentMethod: t.paymentMethod,
            lineItemCount: t.lineItemCount,
            totalTax: Number(t.totalTax),
            cashier: t.cashier?.name,
            createdAt: t.createdAt,
            total: getSaleGrandTotal(t),
          };
        });

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/accountant')}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-3"
          >
            <ArrowLeft size={16} />
            <span>Back to overview</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Transaction Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all sales, refunds, and inventory adjustments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Sales"
          value={saleCount.toString()}
          icon={ShoppingCart}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
        />
        <MetricCard
          title="Refunds"
          value={refundCount.toString()}
          icon={RotateCcw}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
        <MetricCard
          title="Inventory Adjustments"
          value={inventoryRows.length.toString()}
          icon={Package}
          colorClass="bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
        />
      </div>

      {/* DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-none mt-10">
        <DataTable
          columns={filterType === 'inventory' ? inventoryColumns : transactionColumns}
          data={tableData}
          isLoading={loading}
          onRefresh={() => {
            if (filterType === 'inventory') {
              loadInventory();
            } else {
              loadRecent();
            }
          }}
          placeholder="Search transactions..."
          hidePagination={false}
          manualPagination={filterType !== 'inventory'}
          pageCount={filterType !== 'inventory' ? recentMeta.totalPages : undefined}
          pageIndex={filterType !== 'inventory' ? page : undefined}
          onPageChange={filterType !== 'inventory' ? setPage : undefined}
          totalItems={filterType !== 'inventory' ? recentMeta.total : undefined}
          headerActions={
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as StreamFilter)}
                className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all min-w-[180px]"
              >
                <option value="all">Sales & Refunds (All)</option>
                <option value="sale">Sales Only</option>
                <option value="refund">Refunds Only</option>
                <option value="inventory">Inventory Adjustments</option>
              </select>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search invoice, cashier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-11 pr-4 w-[220px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Date From */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
              />

              {/* Date To */}
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono"
              />

              {/* Clear */}
              {(searchQuery || dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="h-10 px-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
};

export default AllTransactions;
