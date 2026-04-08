# Offline Mode & Sync Implementation

## Overview

Complete implementation of offline mode functionality for the POS system, allowing uninterrupted sales during internet outages with automatic synchronization when connectivity is restored.

## Architecture

### Services

#### 1. `offline-storage.service.ts`
IndexedDB-based storage for offline sales with the following features:
- **Persistent Storage**: Uses IndexedDB for reliable local storage
- **Sale Tracking**: Stores complete sale data with sync status
- **Status Management**: PENDING, SYNCING, SYNCED, FAILED states
- **Retry Logic**: Tracks retry count for failed syncs
- **Cleanup**: Auto-removal of synced sales

**Key Methods:**
- `saveSale(sale)` - Save offline sale to IndexedDB
- `getPendingSales()` - Get all pending sales for sync
- `getAllSales()` - Get all offline sales for UI
- `updateSyncStatus(tempId, status)` - Update sync status
- `removeSale(tempId)` - Remove synced sale
- `resetFailedSales()` - Reset failed sales for retry

#### 2. `offline-sync.service.ts`
Handles synchronization of offline sales with backend API.

**Features:**
- Auto-sync on reconnection
- Batch syncing by device
- Progress tracking with callbacks
- Single sale sync support
- Retry failed sales

**Key Methods:**
- `syncPendingSales()` - Sync all pending sales
- `syncSingleSale(tempId)` - Sync individual sale
- `retryFailedSales()` - Retry all failed sales
- `subscribeProgress(listener)` - Subscribe to sync progress

#### 3. `useOnlineStatus.ts` (React Hook)
Provides online/offline status and sync functionality to components.

**Returns:**
- `isOnline` - Current connection status
- `syncProgress` - Current sync progress object
- `pendingCount` - Number of pending offline sales
- `triggerSync()` - Manual sync trigger
- `retryFailed()` - Retry failed sales
- `isSyncing` - Whether sync is in progress

### Components

#### 1. `POSInterface.tsx` (Updated)
Main POS terminal with offline support.

**Changes:**
- Uses `useOnlineStatus` hook for connectivity
- Saves sales to IndexedDB when offline
- Shows offline banner with pending count
- Displays sync progress during synchronization
- Manual sync trigger button (when online + pending sales)

**UI Elements:**
- **Offline Banner**: Yellow banner showing "YOU ARE OFFLINE" with pending count
- **Sync Progress Banner**: Blue banner with progress bar during sync
- **Sync Complete Banner**: Green banner on successful sync
- **Sync Error Banner**: Red banner on sync failure
- **Manual Sync Button**: "Sync {count}" button in header

#### 2. `ReceiptPage.tsx` (Updated)
Receipt display with offline sale support.

**Changes:**
- Loads offline sales from IndexedDB
- Shows "Pending Sync" status for offline sales
- "Sync Now" button for manual sync (when online)
- Offline indicator badge when offline

#### 3. `OfflineSalesPage.tsx` (New)
Dashboard for managing offline sales.

**Features:**
- View all offline sales (Pending, Failed, Synced)
- Statistics cards (Pending, Failed, Synced counts)
- Sync All button
- Retry All button for failed sales
- Individual sale actions (View Receipt, Delete)
- Real-time status updates

**Route:** `/cashier/offline-sales`

#### 4. `CashierDashboard.tsx` (Updated)
Added Offline Sales navigation.

**Changes:**
- New sidebar link: "Offline Sales"
- New route: `/cashier/offline-sales`

## User Flow

### Online Mode (Normal Operation)
1. User scans/adds products to cart
2. Selects payment method
3. Clicks "COMPLETE SALE"
4. Sale sent to backend API
5. Receipt page shows "Completed" status
6. Auto-prints receipt

### Offline Mode
1. Internet connection lost
2. Yellow "YOU ARE OFFLINE" banner appears
3. User continues scanning/adding products
4. Clicks "COMPLETE SALE"
5. Sale saved to IndexedDB with status "PENDING"
6. Receipt page shows "Pending Sync" status
7. "Sync Now" button available (disabled when offline)

### Reconnection & Auto-Sync
1. Internet connection restored
2. Green status indicator shows "Online"
3. Auto-sync triggered automatically
4. Blue "SYNCING OFFLINE SALES" banner with progress
5. Pending sales sent to backend via `/sync/sales` API
6. Successfully synced sales removed from IndexedDB
7. Green "SYNC COMPLETED" banner shown
8. If sync fails, red "SYNC FAILED" banner with error

### Manual Sync
1. User sees pending count in header
2. Clicks "Sync {count}" button
3. Sync progress shown with percentage
4. Completion/error banner displayed

### Failed Sync Handling
1. Sale marked as "FAILED" with error message
2. Remains in IndexedDB for retry
3. User can retry via:
   - "Retry All" button in Offline Sales page
   - "Sync Now" button on receipt
   - Auto-retry on next reconnection

## Data Structure

### OfflineSale Type
```typescript
{
  tempId: string;              // Unique temporary ID (OFF-timestamp-random)
  invoiceNumber: string;       // Temporary invoice (OFF-timestamp)
  deviceId: string;            // POS terminal ID
  paymentMethod: string;       // CASH, CARD, etc.
  discountAmount: number;      // Discount applied
  notes?: string;              // Customer notes
  items: Array<{               // Sale items
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    price: number;
  }>;
  totals: {                    // Financial totals
    subtotal: number;
    tax: number;
    total: number;
  };
  createdAt: string;           // ISO timestamp
  syncedAt?: string;           // Sync completion timestamp
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  syncError?: string;          // Error message if failed
  retryCount: number;          // Number of sync attempts
}
```

## API Integration

### Backend Endpoint
```
POST /api/v1/sync/sales
```

**Request Body:**
```json
{
  "batchId": "batch-timestamp-random",
  "deviceId": "device-123",
  "sales": [
    {
      "saleId": "OFF-123456",
      "invoiceNumber": "OFF-123456",
      "deviceId": "device-123",
      "paymentMethod": "CARD",
      "discountAmount": 0,
      "items": [...],
      "totals": {...},
      "offlineCreatedAt": "2024-01-01T10:00:00Z",
      "idempotencyKey": "offline-OFF-123456-timestamp"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 5 sales successfully",
  "data": {
    "syncedCount": 5,
    "failedCount": 0
  }
}
```

## Browser Compatibility

- **IndexedDB**: Supported in all modern browsers
- **Online/Offline Events**: Standard browser APIs
- **Fallback**: Graceful degradation if IndexedDB unavailable

## Testing Scenarios

### 1. Offline Sale Creation
1. Disconnect internet
2. Add items to cart
3. Complete sale
4. Verify sale saved to IndexedDB
5. Verify receipt shows "Pending Sync"

### 2. Auto-Sync on Reconnection
1. Create offline sale
2. Reconnect internet
3. Verify auto-sync triggered
4. Verify sync progress shown
5. Verify sale removed from IndexedDB
6. Verify "Sync Completed" banner

### 3. Manual Sync
1. Create multiple offline sales
2. Reconnect internet
3. Click "Sync {count}" button
4. Verify all sales synced
5. Verify pending count updates

### 4. Failed Sync Retry
1. Create offline sale
2. Simulate API error (500)
3. Verify sale marked as FAILED
4. Click "Retry All"
5. Verify sale synced on retry

### 5. Offline Sales Dashboard
1. Create multiple offline sales
2. Navigate to Offline Sales page
3. Verify statistics correct
4. Test View Receipt
5. Test Delete sale
6. Test Sync All

## Error Handling

### Network Errors
- Sale remains in PENDING state
- Auto-retry on next reconnection
- User can manually retry

### API Errors (4xx/5xx)
- Sale marked as FAILED
- Error message stored
- User can view error in Offline Sales page

### IndexedDB Errors
- Fallback to localStorage (if implemented)
- User notified of storage issue
- Sale data preserved when possible

## Performance Considerations

- **Batch Sync**: Sales grouped by device for efficient API calls
- **Progressive UI**: Sync progress shown in real-time
- **Cleanup**: Synced sales automatically removed
- **Debouncing**: Sync progress updates throttled

## Security

- **Idempotency Keys**: Prevent duplicate sales
- **Local Storage**: No sensitive data stored locally
- **HTTPS Required**: For production deployments

## Future Enhancements

1. **Background Sync**: Use Service Worker API for background sync
2. **Conflict Resolution**: Handle sync conflicts with server data
3. **Offline Reports**: Generate reports from local data
4. **Storage Quota**: Monitor IndexedDB storage usage
5. **Export/Import**: Backup offline sales data

## Files Created/Modified

### New Files
- `src/services/offline-storage.service.ts`
- `src/services/offline-sync.service.ts`
- `src/api/sync.api.ts`
- `src/hooks/useOnlineStatus.ts`
- `src/pages/cashier/OfflineSalesPage.tsx`

### Modified Files
- `src/pages/cashier/POSInterface.tsx`
- `src/pages/cashier/ReceiptPage.tsx`
- `src/pages/cashier/CashierDashboard.tsx`
- `src/index.css` (print styles)

## Dependencies

No additional npm packages required. Uses:
- Browser IndexedDB API
- Browser Online/Offline events
- Existing React, Axios setup

## Support

For issues or questions:
1. Check browser console for error logs
2. Verify IndexedDB data in DevTools
3. Check network tab for sync API calls
4. Review sync progress logs
