import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Wifi, WifiOff, Clock, LogOut, Loader2, AlertCircle, User } from 'lucide-react';
import { devicesApi } from '../../service/api';
import { useDeviceStore } from '../../store/useDeviceStore';
import { useAuthStore } from '../../store/useAuthStore';

type Device = {
  id: string;
  deviceName: string;
  deviceType?: string;
  isActive: boolean;
  lastActiveAt?: string;
  lastHeartbeatAt?: string;
  ipAddress?: string;
  currentUserId?: string | null;
  currentUser?: { id: string; name: string; email: string } | null;
};

/**
 * Device Selection Screen - Cashier POS
 * 
 * User Story: Cashier must attach to a specific terminal before selling.
 * 
 * Behaviour & API:
 * - On Mount: GET /devices with loading skeletons
 * - Show only devices with isActive = true
 * - On Use This Device: PATCH /devices/:id/heartbeat, save deviceId, navigate to POS Terminal
 * - If no active devices: Show warning, only action is Logout
 */
const DeviceSelection: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const { setDevice } = useDeviceStore();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  // Load devices on component mount
  useEffect(() => {
    const loadDevices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await devicesApi.getAll();
        if (res.data?.success) {
          const list = (res.data.data?.devices || res.data.data || []) as Device[];
          
          // 🧪 TESTING: Check for test mode via URL query param
          // Usage: /cashier/devices?test=no-devices
          const urlParams = new URLSearchParams(window.location.search);
          const testMode = urlParams.get('test');
          
          if (testMode === 'no-devices') {
            console.log('🧪 [TEST MODE] Simulating no active devices');
            setDevices([]);
          } else {
            // Keep the active devices list
            const activeOnes = list.filter((d) => d.isActive);
            
            // 🛡️ SECURITY: Filter by user's assigned terminals if applicable
            // If user has assignedTerminals, only show those.
            const assignedIds = user?.assignedTerminals?.map(t => t.id) || [];
            
            if (assignedIds.length > 0) {
              const userAssigned = activeOnes.filter(d => assignedIds.includes(d.id));
              setDevices(userAssigned);
              
              // Store the full active list in a hidden ref or state if needed for lane calculation
              // Actually, we can just pass the full list to handleUseDevice or calculate it here.
              (window as any)._allActiveDevices = activeOnes; 
            } else {
              setDevices(activeOnes);
              (window as any)._allActiveDevices = activeOnes;
            }
          }
        } else {
          setError(res.data?.message || 'Failed to load devices');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Unable to load devices. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, []);

  /**
   * Handle device selection
   * - Call heartbeat API to attach cashier to terminal
   * - Save device info to store
   * - Navigate to POS Terminal
   */
  const handleUseDevice = async (device: Device) => {
    // 🔀 INTERLEAVING LOGIC: Determine this terminal's 'lane' among all active terminals in the store.
    // IMPORTANT: We use the full list of active terminals (not just the filtered ones) 
    // to ensure Lane 1, Lane 2, etc. remain stable for everyone.
    const allActive = (window as any)._allActiveDevices || devices;
    const sortedDevices = [...allActive].sort((a, b) => a.id.localeCompare(b.id));
    const laneIndex = sortedDevices.findIndex(d => d.id === device.id);
    
    // Lane is 1-based (Terminal 1, Terminal 2, etc.)
    const terminalLane = laneIndex !== -1 ? laneIndex + 1 : 1;
    const totalLanes = Math.max(1, sortedDevices.length);

    console.log(`📡 [DeviceSelection] Attaching to Lane ${terminalLane} of ${totalLanes} (Total Terminals)`);

    setSelectingId(device.id);
    setError(null);
    try {
      // Heartbeat to attach cashier to terminal
      await devicesApi.heartbeat(device.id);

      // Save device to persistent store with lane info
      setDevice({
        deviceId: device.id,
        deviceName: device.deviceName || 'POS Terminal',
        lastHeartbeatAt: new Date().toISOString(),
        terminalLane,
        totalLanes,
      });

      // Navigate to POS Terminal
      navigate('/cashier/terminal');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to attach to device');
    } finally {
      setSelectingId(null);
    }
  };

  /**
   * Handle logout
   * - Call logout API
   * - Clear auth store
   * - Redirect to login
   */
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /**
   * Check if device is online based on last heartbeat
   * Consider device online if heartbeat within last 5 minutes
   */
  const isDeviceOnline = (device: Device): boolean => {
    const lastActive = device.lastActiveAt || device.lastHeartbeatAt;
    if (!lastActive) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  };

  /**
   * Format last active timestamp
   */
  const formatLastActive = (device: Device): string => {
    const lastActive = device.lastActiveAt || device.lastHeartbeatAt;
    if (!lastActive) return 'Just now';
    
    const date = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleString();
  };

  const hasActiveDevices = devices.length > 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA] p-6 lg:p-10">
      {/* Header with Logout */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Select Terminal Device
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Attach your cashier session to a specific POS terminal before starting sales.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Logged in as
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {user.name || user.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-start space-x-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State - Skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100" />
                  <div>
                    <div className="h-4 w-32 rounded bg-slate-100 mb-2" />
                    <div className="h-3 w-24 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
              <div className="h-3 w-40 rounded bg-slate-100 mb-6" />
              <div className="h-9 w-full rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      ) : hasActiveDevices ? (
        /* Device Cards Grid - Free vs In use */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {devices.map((device) => {
            const online = isDeviceOnline(device);
            const isInUse = !!device.currentUserId;
            const inUseBy = device.currentUser?.name || 'Another cashier';
            
            return (
              <div
                key={device.id}
                className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200 ${
                  isInUse 
                    ? 'border-slate-200 bg-slate-50/80 opacity-90' 
                    : 'border-slate-200 bg-white hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10'
                }`}
              >
                {/* Header: Icon + Name + Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      isInUse ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'
                    }`}>
                      <Monitor size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {device.deviceName || 'POS Terminal'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {device.deviceType || 'POS'} • {device.id.slice(-6).toUpperCase()}
                      </div>
                      {isInUse && (
                        <div className="flex items-center space-x-1 mt-1.5 text-slate-500">
                          <User size={12} />
                          <span className="text-[10px] font-semibold tracking-tight">Active session: {inUseBy}</span>
                        </div>
                      )}
                      {!isInUse && (
                        <div className="flex items-center space-x-1 mt-1.5 text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badge: Online/Offline */}
                  <div className={`flex items-center space-x-1.5 rounded-full px-2.5 py-1.5 ${
                    online ? 'bg-emerald-50' : 'bg-slate-100'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${online ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                {/* Last Active Timestamp */}
                <div className="mb-5 flex items-center space-x-2 text-xs text-slate-500">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-medium">
                    Last active: <span className="font-semibold text-slate-700">{formatLastActive(device)}</span>
                  </span>
                </div>

                {/* Use This Device Button */}
                <button
                  disabled={!!selectingId}
                  onClick={() => handleUseDevice(device)}
                  className="inline-flex items-center justify-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-[0.98] bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md disabled:bg-emerald-400"
                >
                  {selectingId === device.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Attaching...</span>
                    </>
                  ) : isInUse ? (
                    <span>Unavailable</span>
                  ) : (
                    <>
                      <Wifi size={16} />
                      <span>Use This Device</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* No Active Devices - Warning State */
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-amber-200 bg-amber-50/60 p-10 text-center">
            <div className="mb-4 inline-flex rounded-full bg-amber-100 p-4 text-amber-600">
              <WifiOff size={28} />
            </div>
            <h2 className="mb-2 text-xl font-extrabold text-amber-900">
              No Active Devices Found
            </h2>
            <p className="mb-6 text-sm font-medium text-amber-800">
              There are currently no active POS terminals available. Please contact your store
              administrator to activate a device, or try again later.
            </p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-2 rounded-xl border border-amber-300 bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-900 hover:bg-amber-100 transition-all"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelection;
