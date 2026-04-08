/**
 * Offline Sync Service
 * Handles synchronization of offline sales with the backend
 */

import api from '../service/api';
import { offlineStorage, type OfflineSale } from './offline-storage.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type SyncProgress = {
  total: number;
  completed: number;
  failed: number;
  current: number;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  message?: string;
};

export type SyncResult = {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ tempId: string; error: string }>;
};

class OfflineSyncService {
  private isSyncing = false;
  private progress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    current: 0,
    status: 'idle',
  };
  private progressListeners: Set<(progress: SyncProgress) => void> = new Set();

  /**
   * Subscribe to sync progress updates
   */
  subscribeProgress(listener: (progress: SyncProgress) => void): () => void {
    this.progressListeners.add(listener);
    // Immediately notify current state
    listener(this.progress);
    // Return unsubscribe function
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  /**
   * Notify all progress listeners
   */
  private notifyProgress() {
    this.progressListeners.forEach((listener) => listener(this.progress));
  }

  /**
   * Update progress state
   */
  private setProgress(update: Partial<SyncProgress>) {
    this.progress = { ...this.progress, ...update };
    this.notifyProgress();
  }

  /**
   * Reset progress state
   */
  private resetProgress() {
    this.progress = {
      total: 0,
      completed: 0,
      failed: 0,
      current: 0,
      status: 'idle',
    };
    this.notifyProgress();
  }

  /**
   * Get current sync progress
   */
  getProgress(): SyncProgress {
    return { ...this.progress };
  }

  /**
   * Check if currently syncing
   */
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending offline sales
   */
  async syncPendingSales(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('⚠️ [OfflineSync] Sync already in progress, skipping...');
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    // Check if online
    if (!navigator.onLine) {
      console.log('⚠️ [OfflineSync] Currently offline, cannot sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: [] };
    }

    this.isSyncing = true;
    this.resetProgress();
    this.setProgress({ status: 'syncing' });

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Get pending sales
      const pendingSales = await offlineStorage.getPendingSales();
      
      if (pendingSales.length === 0) {
        console.log('✅ [OfflineSync] No pending sales to sync');
        this.setProgress({ status: 'completed', message: 'No pending sales' });
        this.isSyncing = false;
        return result;
      }

      console.log(`🔄 [OfflineSync] Starting sync of ${pendingSales.length} pending sales`);
      this.setProgress({ 
        total: pendingSales.length,
        message: `Syncing ${pendingSales.length} offline sales...`,
      });

      // Group sales by device for batch syncing
      const salesByDevice = new Map<string, OfflineSale[]>();
      pendingSales.forEach((sale) => {
        const existing = salesByDevice.get(sale.deviceId) || [];
        existing.push(sale);
        salesByDevice.set(sale.deviceId, existing);
      });

      // Sync each device's sales
      for (const [deviceId, sales] of salesByDevice.entries()) {
        const deviceResult = await this.syncDeviceSales(deviceId, sales);
        result.syncedCount += deviceResult.syncedCount;
        result.failedCount += deviceResult.failedCount;
        result.errors.push(...deviceResult.errors);
      }

      // Clean up synced sales
      await offlineStorage.clearSyncedSales();

      if (result.failedCount > 0) {
        result.success = false;
        this.setProgress({ 
          status: 'completed',
          message: `Synced ${result.syncedCount}, ${result.failedCount} failed`,
        });
      } else {
        this.setProgress({ 
          status: 'completed',
          message: `Successfully synced ${result.syncedCount} sales`,
        });
      }

      console.log(`✅ [OfflineSync] Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);
    } catch (error: any) {
      console.error('❌ [OfflineSync] Sync failed:', error);
      result.success = false;
      this.setProgress({ 
        status: 'error',
        message: error.message || 'Sync failed',
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync sales for a specific device
   */
  private async syncDeviceSales(
    deviceId: string,
    sales: OfflineSale[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Prepare sales for API
    const salesPayload = sales.map((sale) => ({
      saleId: sale.tempId,
      invoiceNumber: sale.invoiceNumber,
      deviceId: sale.deviceId,
      paymentMethod: sale.paymentMethod,
      discountAmount: sale.discountAmount,
      notes: sale.notes,
      items: sale.items,
      totals: sale.totals,
      offlineCreatedAt: sale.createdAt,
      idempotencyKey: `offline-${sale.tempId}-${Date.now()}`,
    }));

    console.log(`📦 [OfflineSync] Syncing batch of ${sales.length} sales for device ${deviceId}`);

    try {
      // Call sync API using configured api instance (includes auth token)
      const response = await api.post(
        '/sync/sales',
        {
          batchId,
          deviceId,
          sales: salesPayload,
        },
        {
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data?.success) {
        console.log(`✅ [OfflineSync] Batch sync successful: ${sales.length} sales`);
        
        // Mark all as synced
        for (const sale of sales) {
          await offlineStorage.removeSale(sale.tempId);
          result.syncedCount++;
          this.setProgress({ 
            completed: result.syncedCount + result.failedCount,
            current: sales.indexOf(sale) + 1,
          });
        }
      } else {
        throw new Error(response.data?.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error('❌ [OfflineSync] Batch sync failed:', error);
      
      // Mark individual sales as failed
      const errorMessage = error.response?.data?.message || error.message || 'Network error';
      
      for (const sale of sales) {
        await offlineStorage.markAsFailed(sale.tempId, errorMessage);
        result.failedCount++;
        result.errors.push({ tempId: sale.tempId, error: errorMessage });
        this.setProgress({ 
          failed: result.failedCount,
          current: sales.indexOf(sale) + 1,
        });
      }
    }

    return result;
  }

  /**
   * Sync a single offline sale immediately
   */
  async syncSingleSale(tempId: string): Promise<boolean> {
    if (!navigator.onLine) {
      console.log('⚠️ [OfflineSync] Currently offline, cannot sync');
      return false;
    }

    const sale = await offlineStorage.getSale(tempId);
    if (!sale) {
      console.warn('⚠️ [OfflineSync] Sale not found in IndexedDB (may already be synced):', tempId);
      // Sale might have been synced and removed - this is OK, return true
      return true;
    }

    try {
      await offlineStorage.markAsSyncing(tempId);

      const response = await api.post(
        '/sync/sales',
        {
          batchId: `single-${Date.now()}`,
          deviceId: sale.deviceId,
          sales: [{
            saleId: sale.tempId,
            invoiceNumber: sale.invoiceNumber,
            deviceId: sale.deviceId,
            paymentMethod: sale.paymentMethod,
            discountAmount: sale.discountAmount,
            notes: sale.notes,
            items: sale.items,
            totals: sale.totals,
            offlineCreatedAt: sale.createdAt,
            idempotencyKey: `offline-${sale.tempId}-${Date.now()}`,
          }],
        },
        {
          timeout: 30000,
        }
      );

      if (response.data?.success) {
        await offlineStorage.removeSale(tempId);
        console.log(`✅ [OfflineSync] Single sale synced: ${tempId}`);
        return true;
      } else {
        throw new Error(response.data?.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error('❌ [OfflineSync] Single sale sync failed:', error);
      await offlineStorage.markAsFailed(
        tempId,
        error.response?.data?.message || error.message || 'Network error'
      );
      return false;
    }
  }

  /**
   * Retry failed sales
   */
  async retryFailedSales(): Promise<SyncResult> {
    console.log('🔄 [OfflineSync] Retrying failed sales...');
    await offlineStorage.resetFailedSales();
    return this.syncPendingSales();
  }

  /**
   * Get pending sales count
   */
  async getPendingCount(): Promise<number> {
    return offlineStorage.getPendingCount();
  }

  /**
   * Get all offline sales for UI
   */
  async getAllOfflineSales(): Promise<OfflineSale[]> {
    return offlineStorage.getAllSales();
  }
}

// Export singleton instance
export const offlineSync = new OfflineSyncService();
