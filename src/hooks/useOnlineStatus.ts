/**
 * useOnlineStatus Hook
 * Provides online/offline status and sync functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineSync, type SyncProgress } from '../services/offline-sync.service';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  
  // Use refs to store unsubscribe functions to avoid initialization issues
  const progressUnsubscribeRef = useRef<(() => void) | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineSync.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Handle online status change
  const handleOnline = useCallback(async () => {
    console.log('🟢 [useOnlineStatus] Connection restored, triggering sync...');
    setIsOnline(true);

    // Auto-sync when back online
    try {
      // Create subscription and store in ref
      progressUnsubscribeRef.current = offlineSync.subscribeProgress((progress) => {
        setSyncProgress({ ...progress });

        if (progress.status === 'completed' || progress.status === 'error') {
          // Unsubscribe using ref (safe - already initialized)
          if (progressUnsubscribeRef.current) {
            progressUnsubscribeRef.current();
            progressUnsubscribeRef.current = null;
          }
          updatePendingCount();
          setSyncProgress(null);
        }
      });

      await offlineSync.syncPendingSales();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }, [updatePendingCount]);

  const handleOffline = useCallback(() => {
    console.log('🔴 [useOnlineStatus] Connection lost');
    setIsOnline(false);
  }, []);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync progress - store in ref for safe access
    progressUnsubscribeRef.current = offlineSync.subscribeProgress((progress) => {
      setSyncProgress({ ...progress });

      if (progress.status === 'completed' || progress.status === 'error') {
        // Delay cleanup to avoid state updates during render
        setTimeout(() => {
          setSyncProgress(null);
          updatePendingCount();
        }, 3000);
      }
    });

    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Unsubscribe from progress updates
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }
    };
  }, [handleOnline, handleOffline, updatePendingCount]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      console.warn('Cannot sync while offline');
      return { success: false, error: 'Currently offline' };
    }

    try {
      const result = await offlineSync.syncPendingSales();
      await updatePendingCount();
      return result;
    } catch (error: any) {
      console.error('Manual sync failed:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline, updatePendingCount]);

  // Retry failed sales
  const retryFailed = useCallback(async () => {
    if (!isOnline) {
      console.warn('Cannot retry while offline');
      return { success: false, error: 'Currently offline' };
    }

    try {
      const result = await offlineSync.retryFailedSales();
      await updatePendingCount();
      return result;
    } catch (error: any) {
      console.error('Retry failed:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline, updatePendingCount]);

  return {
    isOnline,
    syncProgress,
    pendingCount,
    triggerSync,
    retryFailed,
    isSyncing: syncProgress?.status === 'syncing',
  };
};
