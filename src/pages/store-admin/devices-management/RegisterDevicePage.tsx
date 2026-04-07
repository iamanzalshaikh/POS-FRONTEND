import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Cpu, Network, Info, Shield, Printer } from 'lucide-react';
import Sidebar from '@/components/store-admin/Sidebar';
import TopNavbar from '@/components/store-admin/TopNavbar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-[#F7F8FA] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-6 lg:p-10 w-full">
          <div className="max-w-4xl mx-auto w-full">
            <div className="mb-8">
              <button
                onClick={() => navigate('/store-admin/devices')}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Devices
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Register New Device</h1>
              <p className="text-gray-500 mt-1">Configure and authorize a new hardware terminal for your store.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-12">
              {/* Device Information */}
              <div className="space-y-6">
                <div className={sectionCls}>
                  <div className={iconCls}><Cpu className="w-5 h-5" /></div>
                  <h3 className="text-lg font-medium text-gray-800">Device Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className={labelCls}>Device Name</label>
                    <input type="text" name="deviceName" value={formData.deviceName} onChange={handleChange} placeholder="e.g., Counter-3" className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Serial Number</label>
                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="SN-XXXX" className={inputCls} />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Device Type</label>
                    <select name="deviceType" value={formData.deviceType} onChange={handleChange} className={inputCls + ' bg-white'}>
                      <option value="POS Terminal">POS Terminal</option>
                      <option value="Self Checkout">Self Checkout</option>
                      <option value="Mobile POS">Mobile POS</option>
                      <option value="Kiosk">Kiosk</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Connection Details */}
              <div className="space-y-6">
                <div className={sectionCls}>
                  <div className={iconCls}><Network className="w-5 h-5" /></div>
                  <h3 className="text-lg font-medium text-gray-800">Connection Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className={labelCls}>IP Address</label>
                    <input type="text" name="ipAddress" value={formData.ipAddress} onChange={handleChange} placeholder="192.168.1.10" className={inputCls} />
                    <p className="text-[11px] text-gray-400">Format: xxx.xxx.xxx.xxx</p>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Scanner Connection</label>
                    <select name="scannerConnection" value={formData.scannerConnection} onChange={handleChange} className={inputCls + ' bg-white'}>
                      <option value="USB">USB</option>
                      <option value="Bluetooth">Bluetooth</option>
                      <option value="Network">Network</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Primary Printer</label>
                    <select name="printerType" value={formData.printerType} onChange={handleChange} className={inputCls + ' bg-white'}>
                      <option value="Thermal 80mm">Thermal 80mm</option>
                      <option value="Thermal 58mm">Thermal 58mm</option>
                      <option value="Network Printer">Network Printer</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                <button type="button" onClick={() => navigate('/store-admin/devices')} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium" disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Registering...</>
                  ) : (
                    'Register Device'
                  )}
                </button>
              </div>
            </form>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: Info, text: 'Ensure the device IP is static to avoid connection issues with printers.', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
                { icon: Shield, text: 'Serial numbers are unique and can only be registered once per account.', bg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
                { icon: Printer, text: 'Check printer drivers are installed before registering the device.', bg: 'bg-amber-50', iconColor: 'text-amber-600' },
              ].map((c, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-start gap-4">
                  <div className={`p-2 ${c.bg} ${c.iconColor} rounded-lg`}><c.icon className="w-5 h-5" /></div>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


