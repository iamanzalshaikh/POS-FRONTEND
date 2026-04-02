import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Laptop2, AlertCircle, Plus, Activity, Search } from 'lucide-react';
import { devicesApi } from '../../service/api';
import { DataTable } from '@/components/global-components/data-table';
import type { ColumnDef } from '@tanstack/react-table';

const DeviceManagement: React.FC = () => {

  const { data: devicesRes, isLoading, error: devicesError } = useQuery({
    queryKey: ['devices', 'all'],
    queryFn: () => devicesApi.getAll(),
  });

  const devices = devicesRes?.data?.data || [];
  const error = (devicesError as any)?.response?.data?.message || (devicesError as any)?.message;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 pt-2 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Laptop2 className="w-8 h-8 mr-3 text-indigo-500" />
            Device Fleet
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Monitor and manage all provisioned POS terminals and kiosks.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#1f1e35] text-white rounded-lg text-sm font-bold hover:bg-[#2a2845] transition-colors shadow-md">
            <Plus className="w-4 h-4 text-white" />
            <span>Register Device</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        {/* Table Search / Filter Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by serial number..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-500">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-4 h-4" />
              <span>{devices.filter((d: any) => d.isActive).length} Active</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg">
               <span>{devices.filter((d: any) => !d.isActive).length} Offline</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Use shared DataTable for consistent behaviour and features */}
          <DataTable
            columns={(
              [
                {
                  accessorKey: 'deviceName',
                  header: 'Device Name',
                  cell: ({ row }) => (
                    <div>
                      <div className="font-extrabold text-slate-900 tracking-tight">{row.original.deviceName}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{row.original.deviceType}</div>
                    </div>
                  ),
                },
                { accessorKey: 'storeId', header: 'Store Reference', cell: ({ getValue }) => String(getValue()).substring(0,8) + '...' },
                { accessorKey: 'serialNumber', header: 'Serial Number' },
                { accessorKey: 'barcodeScanner', header: 'Scanner', cell: ({ row }) => row.original.barcodeScanner ? (row.original.scannerType || 'USB') : 'NONE' },
                { accessorKey: 'isActive', header: 'Status', cell: ({ getValue }) => getValue() ? 'Online' : 'Offline' },
                { accessorKey: 'lastActiveAt', header: 'Last Heartbeat', cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleString() : 'Never' },
              ] as ColumnDef<any, any>[]
            )}
            data={devices}
            searchKey="serialNumber"
            showExport
            isLoading={isLoading}
            placeholder="Search devices..."
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceManagement;