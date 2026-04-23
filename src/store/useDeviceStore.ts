
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DeviceState = {
  deviceId: string | null;
  deviceName: string | null;
  terminalLane: number;
  totalLanes: number;
  lastHeartbeatAt: string | null;
  setDevice: (payload: { deviceId: string; deviceName?: string | null; lastHeartbeatAt?: string | null; terminalLane?: number; totalLanes?: number }) => void;
  clearDevice: () => void;
};

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceId: null,
      deviceName: null,
      terminalLane: 1,
      totalLanes: 1,
      lastHeartbeatAt: null,
      setDevice: ({ deviceId, deviceName = null, lastHeartbeatAt = null, terminalLane = 1, totalLanes = 1 }) =>
        set({ deviceId, deviceName, lastHeartbeatAt, terminalLane, totalLanes }),
      clearDevice: () => set({ deviceId: null, deviceName: null, lastHeartbeatAt: null, terminalLane: 1, totalLanes: 1 }),
    }),
    {
      name: 'cashier-device',
      partialize: (state) => ({
        deviceId: state.deviceId,
        deviceName: state.deviceName,
        terminalLane: state.terminalLane,
        totalLanes: state.totalLanes,
        lastHeartbeatAt: state.lastHeartbeatAt,
      }),
    }
  )
);

