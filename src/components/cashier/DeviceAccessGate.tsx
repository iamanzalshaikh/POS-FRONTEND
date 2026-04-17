import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  LogOut, 
  Loader2, 
  Monitor, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  User
} from 'lucide-react';
import { devicesApi } from '../../service/api';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useAuthStore } from '../../store/useAuthStore';

type Device = {
  id: string;
  deviceName: string;
  deviceType?: string;
  isActive: boolean;
  lastActiveAt?: string;
  currentUserId?: string | null;
  currentUser?: { id: string; name: string; email: string } | null;
};

interface DeviceAccessGateProps {
  children: React.ReactNode;
}

/**
 * Device Access Gate - Cashier POS
 * 
 * A blocking modal that prevents POS access until a device is connected.
 * 
 * Behaviour & API:
 * - On Mount: GET /devices?isActive=true to check for available devices
 * - Polls every 5 seconds for newly available devices
 * - Shows blocking popup if no device connected
 * - Only action: Logout button
 * - Auto-closes when device becomes available
 */
const DeviceAccessGate: React.FC<DeviceAccessGateProps> = ({ children }) => {
  const navigate = useNavigate();
  const { deviceId, setDevice, clearDevice } = useDeviceStore();
  const { logout, user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [hasDevice, setHasDevice] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  /**
   * TanStack Query for available devices
   * Optimization: Use high staleTime if device is already connected
   */
  const { 
    data: devicesRes, 
    isLoading: devicesLoading,
    error: devicesError,
    refetch
  } = useQuery({
    queryKey: ['available-devices'],
    queryFn: () => devicesApi.getAll(),
    // If deviceId exists, we don't need to poll frequently (discovery vs validation)
    refetchInterval: deviceId ? 60000 : 5000, 
    staleTime: deviceId ? 1000 * 60 * 2 : 1000 * 2, // 2 mins stale if connected
    enabled: true,
  });

  // Simplified loading and error state from useQuery
  useEffect(() => {
    // Only show loading if we don't have a device yet
    if (!deviceId && devicesLoading !== undefined) {
      setIsLoading(devicesLoading);
    } else {
      setIsLoading(false);
    }
    
    if (devicesError) setError((devicesError as any).message || 'Failed to check device availability');
  }, [devicesLoading, devicesError, deviceId]);

    // Handle results from useQuery
    useEffect(() => {
      if (devicesRes?.data?.success) {
        const allDevices = (devicesRes.data.data?.devices || devicesRes.data.data || []) as Device[];
        const activeDevices = allDevices.filter((d) => d.isActive);
        
        setAvailableDevices(activeDevices);
        setLastChecked(new Date());

        // CRITICAL FIX: If we have a stored deviceId, verify it still exists and is active
        if (deviceId) {
            const currentDevice = activeDevices.find(d => d.id === deviceId);
            if (!currentDevice) {
                console.warn('[DeviceGate] Persistent device is now inactive or deleted. Clearing...');
                clearDevice();
                setHasDevice(false);
            }
        }
        
        // Auto-select if only one free device available
        const freeDevices = activeDevices.filter((d) => !d.currentUserId);
        if (freeDevices.length === 1 && !deviceId && !isSelecting) {
          console.log('[DeviceGate] Auto-selecting single free device');
          handleSelectDevice(freeDevices[0]);
        }
      }
    }, [devicesRes, deviceId, isSelecting, clearDevice]);

  /**
   * Handle device selection
   */
  const handleSelectDevice = async (device: Device) => {
    if (isSelecting) return;
    setIsSelecting(true);
    setError(null);
    try {
      // Heartbeat to attach cashier to terminal
      await devicesApi.heartbeat(device.id);

      // Save device to persistent store
      setDevice({
        deviceId: device.id,
        deviceName: device.deviceName || 'POS Terminal',
        lastHeartbeatAt: new Date().toISOString(),
      });

      setHasDevice(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to connect to device');
    } finally {
      setIsSelecting(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /**
   * Sync hasDevice state
   */
  useEffect(() => {
    if (deviceId) {
      setHasDevice(true);
    }
  }, [deviceId]);

  // If device is connected, render children (POS content)
  if (hasDevice && deviceId) {
    return <>{children}</>;
  }

  // Show blocking modal
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop - cannot click outside */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Monitor size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1e293b] dark:text-white uppercase tracking-widest">
                  Terminal Authorization
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70">
                  Secure device connection required
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center space-x-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                LOCKED
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              /* Loading State */
              <div className="flex flex-col items-center py-12">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-blue-50 dark:border-blue-900/30 rounded-full"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                  Scanning for terminals...
                </p>
              </div>
            ) : error ? (
              /* Error State */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-2xl">
                  <XCircle size={20} className="text-rose-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">Connection Error</p>
                    <p className="text-[10px] font-bold text-rose-600/70 mt-0.5">{error}</p>
                  </div>
                </div>
                <button
                  onClick={() => refetch()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
                >
                  <RefreshCcw size={14} />
                  <span>Retry Discovery</span>
                </button>
              </div>
            ) : availableDevices.length === 0 ? (
              /* No Devices Available */
              <div className="space-y-6">
                <div className="text-center py-6">
                  <div className="inline-flex rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 p-8 text-slate-200 dark:text-slate-700 mb-4">
                    <Monitor size={56} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                    No Terminals Discovered
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed max-w-xs mx-auto">
                    All terminal registries are either offline or currently occupied.
                    Please contact system admin for deployment.
                  </p>
                </div>

                {/* Info Box */}
                <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-normal">
                      Security Protocol: You cannot access the point of sale interface without an authenticated and free terminal connection.
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                    Auto-scanning in 5s... last check: {lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              /* Devices Available */
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-1 w-1 bg-blue-600 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Registries</span>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {availableDevices.map((device) => {
                    const isInUse = !!device.currentUserId;
                    const inUseBy = device.currentUser?.name || 'Authorized Staff';
                    return (
                      <button
                        key={device.id}
                        disabled={isSelecting || isInUse}
                        onClick={() => !isInUse && handleSelectDevice(device)}
                        className={`w-full flex items-center justify-between p-4 rounded-3xl border-2 transition-all disabled:opacity-50
                          ${isInUse 
                            ? 'border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30' 
                            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 active:scale-[0.98]'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all
                            ${isInUse ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600'}`}>
                            <Monitor size={22} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                              {device.deviceName || 'UNNAMED TERMINAL'}
                            </p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              ID: {device.id.slice(-8).toUpperCase()} • {device.deviceType || 'GENERIC'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="shrink-0">
                          {isSelecting ? (
                            <Loader2 size={18} className="text-blue-500 animate-spin" />
                          ) : isInUse ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Occupied By</span>
                              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">{inUseBy}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                              <CheckCircle2 size={12} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Connect</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Authenticated As</p>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{user?.name || user?.email || 'N/A'}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isSelecting || isLoading}
                className="flex items-center gap-2 py-3 px-6 bg-white dark:bg-slate-800 border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95"
              >
                <LogOut size={14} />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-8 animate-pulse">
          Secure Cloud Terminal Authorization Framework
        </p>
      </div>
    </div>
  );
};

export default DeviceAccessGate;
