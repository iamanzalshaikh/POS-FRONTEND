import React, { useState, useEffect } from 'react';
import { X, Store, Mail, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { storesApi } from '../../service/api';
import { PAKISTAN_PROVINCES, PAKISTAN_CITIES } from '../../components/global-components/pakistan-geography';
import { toast } from '@/lib/toast';

interface EditStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  store: any;
}

const EditStoreModal: React.FC<EditStoreModalProps> = ({ isOpen, onClose, onSuccess, store }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    isActive: true,
  });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        email: store.email || '',
        phone: store.phone || '',
        address: store.address || '',
        city: store.city || '',
        state: store.state || '',
        zipCode: store.zipCode || '',
        isActive: store.isActive !== undefined ? store.isActive : true,
      });
    }
  }, [store]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => {
        const next = {
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        };
        if (name === 'state') next.city = '';
        return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await storesApi.update(store.id, formData);
      if (response.data.success) {
        toast.success("Store configuration updated successfully", "Sync Successful");
        onSuccess();
        onClose();
      } else {
        const errorMsg = response.data.message || 'Failed to update store';
        setError(errorMsg);
        toast.error(errorMsg, "Action Failed");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error occurred during update';
      setError(errorMsg);
      toast.error(errorMsg, "Sync Error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-down border border-slate-200">
        
        <div className="flex-shrink-0 px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Edit Store Details</h2>
              <p className="text-sm font-medium text-slate-500">Update configuration for {store.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8">
          <form id="editStoreForm" onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                <Store size={16} className="text-indigo-500" />
                <span>Store Identity</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Store Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center"><Mail size={14} className="mr-1"/> Support Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Support Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">
                <MapPin size={16} className="text-emerald-500" />
                <span>Location</span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Street Address *</label>
                  <input required name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State/Region</label>
                  <select 
                    name="state" 
                    value={formData.state} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select State</option>
                    {PAKISTAN_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                  <select 
                    name="city" 
                    value={formData.city} 
                    onChange={handleChange} 
                    disabled={!formData.state}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {(PAKISTAN_CITIES[formData.state as keyof typeof PAKISTAN_CITIES] || []).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zip/Postal Code</label>
                  <input name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <label className="flex items-center p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive"
                  checked={formData.isActive} 
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900">
                    Store Operational Status: {formData.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">
                    {formData.isActive ? 'Locations are fully operational and processing transactions.' : 'All terminal functions and remote operations for this store are locked.'}
                  </span>
                </div>
              </label>
            </div>

          </form>
        </div>

        <div className="flex-shrink-0 px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="editStoreForm"
            disabled={loading}
            className="px-6 py-3 bg-[#1f1e35] text-white font-bold rounded-xl hover:bg-[#2a2845] transition-colors shadow-md flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditStoreModal;
