import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  ExternalLink,
  Printer,
  Wifi,
} from 'lucide-react';
import { offlineStorage, type OfflineSale } from '../../services/offline-storage.service';
import { offlineSync } from '../../services/offline-sync.service';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import PageHeader from '../../components/global-components/PageHeader';
import MetricCard from '../../components/global-components/MetricCard';
import { formatCurrency, formatInvoiceNumber } from '@/utils/format';
import { cn } from '@/lib/utils';

const OfflineSalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline, triggerSync } = useOnlineStatus();
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
    navigate(`/cashier/receipt/offline/${sale.tempId}`, {
      state: { sale, status: 'PENDING_SYNC' },
    });
  };

  const handleViewAndPrint = (sale: OfflineSale) => {
    navigate(`/cashier/receipt/offline/${sale.tempId}`, {
      state: { sale, status: 'PENDING_SYNC', autoPrint: true },
    });
  };

  const pendingSales = offlineSales.filter(s => s.syncStatus === 'PENDING');
  const failedSales = offlineSales.filter(s => s.syncStatus === 'FAILED');
  const syncedSales = offlineSales.filter(s => s.syncStatus === 'SYNCED');

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Offline Sales"
        description="Manage and synchronize offline transactions"
        primaryAction={pendingSales.length > 0 && isOnline ? {
          label: `Sync All (${pendingSales.length})`,
          icon: RefreshCw,
          onClick: handleSyncAll
        } : undefined}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Connection"
          value={isOnline ? "Online" : "Offline"}
          icon={isOnline ? Wifi : WifiOff}
          colorClass={isOnline ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"}
        />
        <MetricCard
          title="Pending Sync"
          value={String(pendingSales.length)}
          icon={Clock}
          colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
        />
        <MetricCard
          title="Failed Sync"
          value={String(failedSales.length)}
          icon={AlertCircle}
          colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
        />
        <MetricCard
          title="Total Synced"
          value={String(syncedSales.length)}
          icon={CheckCircle}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
        />
      </div>

      {!isOnline && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <WifiOff className="text-amber-600 dark:text-amber-500" size={20} />
          <p className="text-amber-800 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
            Currently Offline. Sales will synchronize automatically when connection is restored.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-none">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <RefreshCw className="animate-spin text-blue-600" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest mt-6">Searching local storage...</p>
          </div>
        ) : offlineSales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CheckCircle className="text-emerald-500/20" size={64} />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mt-6">All Systems Clear</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">No offline sales require synchronization</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Pending & Failed Sales Sections */}
            {[...failedSales, ...pendingSales].length > 0 && (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Clock className="text-amber-500" size={18} />
                  Pending & Failed Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...failedSales, ...pendingSales].map((sale) => (
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

            {/* Recently Synced */}
            {syncedSales.length > 0 && (
              <div className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={18} />
                  Recently Synced
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {syncedSales.slice(0, 10).map((sale) => (
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

const OfflineSaleCard: React.FC<{
  sale: OfflineSale;
  onViewReceipt: () => void;
  onPrintReceipt?: () => void;
  onDelete: () => void;
}> = ({ sale, onViewReceipt, onPrintReceipt, onDelete }) => {
  const statusStyles = {
    PENDING: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30",
    SYNCING: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30",
    SYNCED: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30",
    FAILED: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30",
  }[sale.syncStatus];

  return (
    <div className="group bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none translate-y-0 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border", statusStyles)}>
            {sale.syncStatus}
          </span>
          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mt-3">{formatInvoiceNumber(sale.invoiceNumber)}</h4>
        </div>
        <div className="flex gap-2">
          <button onClick={onViewReceipt} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 rounded-xl transition-all"><ExternalLink size={14} /></button>
          <button onClick={onDelete} className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-400 hover:text-rose-600 rounded-xl transition-all"><Trash2 size={14} /></button>
        </div>
      </div>
      
      <div className="flex justify-between items-end mt-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sale.createdAt).toLocaleTimeString()}</p>
          <p className="text-base font-black text-slate-900 dark:text-white mt-1">Rs {sale.totals.total.toLocaleString()}</p>
        </div>
        {sale.syncStatus === 'PENDING' && onPrintReceipt && (
          <button onClick={onPrintReceipt} className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
            <Printer size={12} />
            Print
          </button>
        )}
      </div>
      
      {sale.syncError && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <p className="text-[9px] text-rose-600 dark:text-rose-400 lowercase font-medium flex items-center gap-1">
              <AlertCircle size={10} />
              {sale.syncError}
           </p>
        </div>
      )}
    </div>
  );
};

export default OfflineSalesPage;
