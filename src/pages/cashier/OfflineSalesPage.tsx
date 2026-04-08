/**
 * Offline Sales Dashboard Page
 * Shows all pending offline sales and allows manual sync/retry
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Printer
} from 'lucide-react';
import { offlineStorage, type OfflineSale } from '../../services/offline-storage.service';
import { offlineSync } from '../../services/offline-sync.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

const OfflineSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline, triggerSync, pendingCount } = useOnlineStatus();
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadOfflineSales = async () => {
    setLoading(true);
    try {
      const sales = await offlineStorage.getAllSales();
      setOfflineSales(sales);
    } catch (error) {
      console.error('Failed to load offline sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineSales();
  }, []);

  const handleSyncAll = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      await triggerSync();
      await loadOfflineSales();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
      await offlineSync.retryFailedSales();
      await loadOfflineSales();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteSale = async (tempId: string) => {
    if (!window.confirm('Delete this offline sale? This cannot be undone.')) return;
    try {
      await offlineStorage.removeSale(tempId);
      await loadOfflineSales();
    } catch (error) {
      console.error('Failed to delete sale:', error);
    }
  };

  const handleViewReceipt = (sale: OfflineSale) => {
    // Navigate to receipt page with sale data
    navigate(`/cashier/receipt/offline/${sale.tempId}`, {
      state: { sale, status: 'PENDING_SYNC' },
    });
  };

  const handleViewAndPrint = (sale: OfflineSale) => {
    // Navigate immediately with local sale data (instant load)
    // Sync will happen in background on ReceiptPage
    console.log('📦 [OfflineSalesPage] Opening receipt for offline sale:', sale.tempId);
    navigate(`/cashier/receipt/offline/${sale.tempId}`, {
      state: { sale, status: 'PENDING_SYNC', autoPrint: true },
    });
  };

  const pendingSales = offlineSales.filter(s => s.syncStatus === 'PENDING');
  const failedSales = offlineSales.filter(s => s.syncStatus === 'FAILED');
  const syncedSales = offlineSales.filter(s => s.syncStatus === 'SYNCED');

  return (
    <div className="min-h-[520px] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/cashier/terminal')}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Offline Sales
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Manage and sync offline transactions
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          {pendingSales.length > 0 && isOnline && (
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 disabled:bg-emerald-400 transition-all"
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              <span>Sync All ({pendingSales.length})</span>
            </button>
          )}
        </div>
      </header>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="flex items-center space-x-3 px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-sm font-medium">
          <WifiOff size={16} className="text-amber-500" />
          <span>
            You are offline. Sales will sync automatically when connection is restored.
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50/40">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Clock size={20} className="text-amber-600" />
          <div>
            <div className="text-2xl font-bold text-amber-900">{pendingSales.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Pending</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={20} className="text-red-600" />
          <div>
            <div className="text-2xl font-bold text-red-900">{failedSales.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-red-700">Failed</div>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle size={20} className="text-emerald-600" />
          <div>
            <div className="text-2xl font-bold text-emerald-900">{syncedSales.length}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Synced</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <span>Loading offline sales...</span>
            </div>
          </div>
        ) : offlineSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <CheckCircle size={48} className="text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No Offline Sales</h3>
            <p className="text-sm text-slate-500 mt-1">All sales have been synced</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Sales */}
            {pendingSales.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest mb-3 flex items-center space-x-2">
                  <Clock size={16} />
                  <span>Pending Sync</span>
                </h3>
                <div className="space-y-2">
                  {pendingSales.map((sale) => (
                    <OfflineSaleCard
                      key={sale.tempId}
                      sale={sale}
                      onViewReceipt={() => handleViewReceipt(sale)}
                      onPrintReceipt={() => handleViewAndPrint(sale)}
                      onDelete={() => handleDeleteSale(sale.tempId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Failed Sales */}
            {failedSales.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-red-900 uppercase tracking-widest flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>Failed to Sync</span>
                  </h3>
                  {isOnline && (
                    <button
                      onClick={handleRetryFailed}
                      disabled={syncing}
                      className="inline-flex items-center space-x-1 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-700 disabled:bg-red-400 transition-all"
                    >
                      <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                      <span>Retry All</span>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {failedSales.map((sale) => (
                    <OfflineSaleCard
                      key={sale.tempId}
                      sale={sale}
                      onViewReceipt={() => handleViewReceipt(sale)}
                      onDelete={() => handleDeleteSale(sale.tempId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Synced Sales */}
            {syncedSales.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-3 flex items-center space-x-2">
                  <CheckCircle size={16} />
                  <span>Recently Synced</span>
                </h3>
                <div className="space-y-2">
                  {syncedSales.slice(0, 5).map((sale) => (
                    <OfflineSaleCard
                      key={sale.tempId}
                      sale={sale}
                      onViewReceipt={() => handleViewReceipt(sale)}
                      onDelete={() => handleDeleteSale(sale.tempId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Offline Sale Card Component
const OfflineSaleCard: React.FC<{
  sale: OfflineSale;
  onViewReceipt: () => void;
  onPrintReceipt?: () => void;
  onDelete: () => void;
}> = ({ sale, onViewReceipt, onPrintReceipt, onDelete }) => {
  const statusConfig = {
    PENDING: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    SYNCING: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    SYNCED: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    FAILED: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  };

  const config = statusConfig[sale.syncStatus];

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${config.bg} ${config.border}`}>
      <div className="flex items-center space-x-4 flex-1">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          {sale.syncStatus === 'FAILED' ? (
            <AlertCircle size={20} className={config.text} />
          ) : sale.syncStatus === 'SYNCED' ? (
            <CheckCircle size={20} className={config.text} />
          ) : (
            <Clock size={20} className={config.text} />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-900">{sale.invoiceNumber}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${config.bg} ${config.text}`}>
              {sale.syncStatus}
            </span>
          </div>
          <div className="flex items-center space-x-4 mt-1 text-xs text-slate-600">
            <span>{new Date(sale.createdAt).toLocaleString()}</span>
            <span>₹{sale.totals.total.toFixed(2)}</span>
            <span className="font-medium">{sale.paymentMethod}</span>
          </div>
          {sale.syncError && (
            <div className="text-[11px] text-red-600 mt-1 flex items-center space-x-1">
              <AlertCircle size={10} />
              <span>Error: {sale.syncError}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onViewReceipt}
          className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all"
        >
          <ExternalLink size={12} />
          <span>View</span>
        </button>
        {sale.syncStatus === 'PENDING' && onPrintReceipt && (
          <button
            onClick={onPrintReceipt}
            className="inline-flex items-center space-x-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-700 transition-all"
          >
            <Printer size={12} />
            <span>Print Receipt</span>
          </button>
        )}
        <button
          onClick={onDelete}
          className="inline-flex items-center space-x-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-100 transition-all"
        >
          <Trash2 size={12} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default OfflineSalesPage;
