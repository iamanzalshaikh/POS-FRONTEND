/**
 * Offline Storage Service
 * Handles local storage of offline sales using IndexedDB
 */

export type OfflineSale = {
  tempId: string;
  invoiceNumber: string;
  deviceId: string;
  paymentMethod: string;
  discountAmount: number;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  createdAt: string;
  syncedAt?: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  syncError?: string;
  retryCount: number;
};

const DB_NAME = 'pos-offline-sales';
const DB_VERSION = 1;
const STORE_NAME = 'offlineSales';

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.db) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ [OfflineStorage] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('retryCount', 'retryCount', { unique: false });
          console.log('✅ [OfflineStorage] Object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save an offline sale to IndexedDB
   */
  async saveSale(sale: OfflineSale): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(sale);

      request.onsuccess = () => {
        console.log('✅ [OfflineStorage] Sale saved:', sale.tempId);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to save sale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all pending offline sales
   */
  async getPendingSales(): Promise<OfflineSale[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll('PENDING');

      request.onsuccess = () => {
        const sales = request.result as OfflineSale[];
        console.log(`📦 [OfflineStorage] Found ${sales.length} pending sales`);
        resolve(sales);
      };

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to get pending sales:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline sales (for UI display)
   */
  async getAllSales(): Promise<OfflineSale[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const sales = request.result as OfflineSale[];
        // Sort by createdAt descending
        sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log(`📦 [OfflineStorage] Found ${sales.length} total sales`);
        resolve(sales);
      };

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to get all sales:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a specific offline sale by tempId
   */
  async getSale(tempId: string): Promise<OfflineSale | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(tempId);

      request.onsuccess = () => {
        resolve(request.result as OfflineSale | null);
      };

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to get sale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update sale sync status
   */
  async updateSyncStatus(
    tempId: string,
    status: OfflineSale['syncStatus'],
    error?: string
  ): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(tempId);

      getRequest.onsuccess = () => {
        const sale = getRequest.result as OfflineSale;
        if (!sale) {
          reject(new Error(`Sale not found: ${tempId}`));
          return;
        }

        const updatedSale: OfflineSale = {
          ...sale,
          syncStatus: status,
          syncError: error,
          retryCount: status === 'FAILED' ? sale.retryCount + 1 : sale.retryCount,
          syncedAt: status === 'SYNCED' ? new Date().toISOString() : sale.syncedAt,
        };

        const putRequest = store.put(updatedSale);
        putRequest.onsuccess = () => {
          console.log(`✅ [OfflineStorage] Updated sync status for ${tempId}: ${status}`);
          resolve();
        };
        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Mark sale as syncing
   */
  async markAsSyncing(tempId: string): Promise<void> {
    return this.updateSyncStatus(tempId, 'SYNCING');
  }

  /**
   * Mark sale as synced (remove from storage)
   */
  async removeSale(tempId: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(tempId);

      request.onsuccess = () => {
        console.log(`✅ [OfflineStorage] Removed synced sale: ${tempId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ [OfflineStorage] Failed to remove sale:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark sale as failed sync
   */
  async markAsFailed(tempId: string, error: string): Promise<void> {
    return this.updateSyncStatus(tempId, 'FAILED', error);
  }

  /**
   * Get count of pending sales
   */
  async getPendingCount(): Promise<number> {
    const sales = await this.getPendingSales();
    return sales.length;
  }

  /**
   * Clear all synced sales (cleanup)
   */
  async clearSyncedSales(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const getRequest = index.getAll('SYNCED');

      getRequest.onsuccess = () => {
        const syncedSales = getRequest.result as OfflineSale[];
        let deletedCount = 0;

        if (syncedSales.length === 0) {
          resolve();
          return;
        }

        syncedSales.forEach((sale) => {
          const deleteRequest = store.delete(sale.tempId);
          deleteRequest.onsuccess = () => {
            deletedCount++;
            if (deletedCount === syncedSales.length) {
              console.log(`✅ [OfflineStorage] Cleared ${deletedCount} synced sales`);
              resolve();
            }
          };
        });
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Reset failed sales to pending for retry
   */
  async resetFailedSales(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const getRequest = index.getAll('FAILED');

      getRequest.onsuccess = () => {
        const failedSales = getRequest.result as OfflineSale[];
        let updatedCount = 0;

        if (failedSales.length === 0) {
          resolve();
          return;
        }

        failedSales.forEach((sale) => {
          const updatedSale: OfflineSale = {
            ...sale,
            syncStatus: 'PENDING',
            syncError: undefined,
          };
          const putRequest = store.put(updatedSale);
          putRequest.onsuccess = () => {
            updatedCount++;
            if (updatedCount === failedSales.length) {
              console.log(`✅ [OfflineStorage] Reset ${updatedCount} failed sales to pending`);
              resolve();
            }
          };
        });
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageService();
