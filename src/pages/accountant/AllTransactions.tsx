import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  Package,
  Search,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import {
  getInventoryLogs,
  getRecentTransactions,
  type RecentFinanceTransaction,
} from '../../api/finance.api';
import { formatCurrency } from '@/utils/format';
import { getSaleGrandTotal } from '@/utils/saleAmounts';

type StreamFilter = 'all' | 'sale' | 'refund' | 'inventory';

const AllTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<StreamFilter>('all');
  const [page, setPage] = useState(1);
  const [recentItems, setRecentItems] = useState<RecentFinanceTransaction[]>([]);
  const [recentMeta, setRecentMeta] = useState({ total: 0, totalPages: 0, limit: 30 });
  const [inventoryRows, setInventoryRows] = useState<
    Array<{
      id: string;
      description: string;
      amountLabel: string;
      dateLabel: string;
    }>
  >([]);

  const loadRecent = useCallback(async () => {
    const res = await getRecentTransactions({
      type: filterType === 'inventory' ? 'all' : filterType,
      page,
      limit: 30,
    });
    if (res.success && res.data) {
      setRecentItems(res.data.items || []);
      const p = res.data.pagination;
      setRecentMeta({
        total: p?.total ?? 0,
        totalPages: p?.totalPages ?? 0,
        limit: p?.limit ?? 30,
      });
    } else {
      setRecentItems([]);
      setRecentMeta({ total: 0, totalPages: 0, limit: 30 });
    }
  }, [filterType, page]);

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
  }, [filterType]);

  const saleCount = recentItems.filter((r) => r.transactionType === 'SALE').length;
  const refundCount = recentItems.filter((r) => r.transactionType === 'REFUND').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 normal-case">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/accountant')}
            className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all group mb-8"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span>Back to overview</span>
          </button>
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                Transaction ledger
              </h1>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                GET /finance/recent-transactions · GET /inventory/logs
              </p>
            </div>
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/10 hidden md:block">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Records (this view)</p>
              <p className="text-lg font-black uppercase tracking-widest leading-none">
                {filterType === 'inventory' ? inventoryRows.length : recentMeta.total}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600">
                <ShoppingCart size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Page</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{saleCount}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Sales (loaded)</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center text-blue-500">
                <RotateCcw size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Page</span>
            </div>
            <div className="text-3xl font-black text-blue-600 tabular-nums">{refundCount}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Refunds (loaded)</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                <Package size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Adjustments</span>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{inventoryRows.length}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Inventory log rows</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Package size={20} />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Stream</h2>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as StreamFilter)}
            className="w-full md:w-[280px] px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="all">Sales &amp; refunds (all)</option>
            <option value="sale">Sales only</option>
            <option value="refund">Refunds only</option>
            <option value="inventory">Inventory adjustments</option>
          </select>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading ledger…</div>
          </div>
        ) : filterType === 'inventory' ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-slate-800/50">
            {inventoryRows.length > 0 ? (
              inventoryRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800">
                      <Package size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {row.description}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                        {row.dateLabel}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Qty change</p>
                    <span className="font-black text-slate-900 dark:text-white text-xl tabular-nums">{row.amountLabel}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center">
                <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No adjustment rows</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm divide-y divide-slate-50 dark:divide-slate-800/50">
              {recentItems.length > 0 ? (
                recentItems.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group"
                  >
                    <div className="flex items-center gap-6 min-w-0">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 shrink-0 ${
                          t.transactionType === 'REFUND'
                            ? 'bg-blue-50 text-blue-500 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                        }`}
                      >
                        {t.transactionType === 'REFUND' ? <RotateCcw size={24} /> : <ShoppingCart size={24} />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                          {t.transactionType} · Invoice {t.invoiceNumber}
                          {t.isOffline && t.offlineInvoiceNumber
                            ? ` (offline ${t.offlineInvoiceNumber})`
                            : ''}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md border ${
                              t.transactionType === 'REFUND'
                                ? 'border-blue-200 text-blue-500'
                                : 'border-emerald-200 text-emerald-600'
                            }`}
                          >
                            {t.paymentMethod}
                          </span>
                          <span>{t.lineItemCount} lines</span>
                          {Number(t.totalTax) > 0 && (
                            <span className="text-amber-700 dark:text-amber-400">
                              GST {formatCurrency(Number(t.totalTax))}
                            </span>
                          )}
                          {t.cashier?.name && <span>{t.cashier.name}</span>}
                          <span>{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <span className="font-black text-slate-900 dark:text-white text-lg tabular-nums">
                          {formatCurrency(getSaleGrandTotal(t))}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center">
                  <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No transactions</p>
                </div>
              )}
            </div>

            {recentMeta.totalPages > 1 && (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Page {page} / {recentMeta.totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={page >= recentMeta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllTransactions;
