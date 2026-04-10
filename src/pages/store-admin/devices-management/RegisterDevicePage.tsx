import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Cpu, Network, Info, Shield, Printer } from 'lucide-react';

type ScannerConnection = 'USB' | 'Bluetooth' | 'Network' | 'None';
type FormData = {
  deviceName: string;
  serialNumber: string;
  deviceType: 'POS Terminal' | 'Self Checkout' | 'Mobile POS' | 'Kiosk';
  ipAddress: string;
  scannerConnection: ScannerConnection;
  printerType: string;
};

const initialForm: FormData = {
  deviceName: '',
  serialNumber: '',
  deviceType: 'POS Terminal',
  ipAddress: '',
  scannerConnection: 'None',
  printerType: 'None',
};

import * as deviceApi from '@/api/devices.api';

export default function RegisterDevicePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const error = localError;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.deviceName) {
      setLocalError('Device name is required');
      return;
    }
    if (!formData.serialNumber) {
      setLocalError('Serial number is required');
      return;
    }

    const payload = {
      deviceName: formData.deviceName,
      deviceType: formData.deviceType,
      serialNumber: formData.serialNumber,
      ipAddress: formData.ipAddress,
      barcodeScanner: formData.scannerConnection !== 'None',
      scannerType:
        formData.scannerConnection === 'Bluetooth' ? 'BLUETOOTH' : formData.scannerConnection === 'USB' ? 'USB' : null,
      userAgent: window.navigator.userAgent,
    };

    setLoading(true);
    deviceApi.registerDevice(payload)
      .then((res) => {
        if (res.data?.success || res.success) {
          navigate('/store-admin/devices');
        } else {
          setLocalError(res.data?.message || res.message || 'Registration failed');
        }
      })
      .catch((err: any) => {
        setLocalError(err.response?.data?.message || 'An error occurred during registration');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400';
  const labelCls = 'text-sm font-medium text-gray-700';
  const sectionCls = 'flex items-center gap-2 pb-2 border-b border-gray-100';
  const iconCls = 'p-2 bg-blue-50 text-blue-600 rounded-lg';

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <div className="mb-8 pl-4">
        <button
          onClick={() => navigate('/store-admin/devices')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 mb-4 group transition-all"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          Hardware Hub
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Register Hardware</h1>
        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Initialize and authorize native terminal node</p>
      </div>

      {error && (
        <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-[28px] flex items-center gap-4 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-xs font-black uppercase tracking-widest leading-loose">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800 p-10 space-y-12 transition-colors duration-300">
        {/* Device Information */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl"><Cpu className="w-5 h-5" /></div>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Hardware Intel</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Terminal Alias</label>
              <input type="text" name="deviceName" value={formData.deviceName} onChange={handleChange} placeholder="e.g. COUNTER-01" className="w-full pl-4 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Serial ID</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="SN-XXXX" className="w-full pl-4 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Machine Class</label>
              <select name="deviceType" value={formData.deviceType} onChange={handleChange} className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white">
                <option value="POS Terminal">POS Terminal</option>
                <option value="Self Checkout">Self Checkout</option>
                <option value="Mobile POS">Mobile POS</option>
                <option value="Kiosk">Kiosk</option>
              </select>
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl"><Network className="w-5 h-5" /></div>
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[3px]">Network Protocol</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Static IP</label>
              <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleChange} placeholder="192.168.1.XX" className="w-full pl-4 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 dark:text-white" />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Scanner IO</label>
              <select name="scannerConnection" value={formData.scannerConnection} onChange={handleChange} className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white">
                <option value="USB">USB Connection</option>
                <option value="Bluetooth">Bluetooth Sync</option>
                <option value="Network">Network Access</option>
                <option value="None">None</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Sloution</label>
              <select name="printerType" value={formData.printerType} onChange={handleChange} className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer text-slate-900 dark:text-white">
                <option value="Thermal 80mm">Thermal 80mm</option>
                <option value="Thermal 58mm">Thermal 58mm</option>
                <option value="Network Printer">Network Printer</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-5 pt-8 border-t border-slate-50 dark:border-slate-800 mt-8">
          <button type="button" onClick={() => navigate('/store-admin/devices')} className="px-8 py-4 border border-slate-100 dark:border-slate-700 text-slate-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 shadow-lg shadow-blue-500/20 shadow-blue-500 transition-all active:scale-95 disabled:opacity-50 border border-blue-500 flex items-center gap-3">
            {loading ? (
              <span className="animate-pulse">Authorizing Protocol...</span>
            ) : (
              'Register Registry'
            )}
          </button>
        </div>
      </form>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          { icon: Info, text: 'Static IP mapping is recommended for stable printer connectivity.', bg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
          { icon: Shield, text: 'HWIDs are immutable once authorized across the node registry.', bg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Printer, text: 'Validate driver compatibility before finalizing hardware link.', bg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
        ].map((c, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[28px] p-6 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
            <div className={`p-3 ${c.bg} ${c.iconColor} rounded-2xl flex-shrink-0 animate-pulse`}><c.icon className="w-5 h-5" /></div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-black uppercase tracking-widest">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


