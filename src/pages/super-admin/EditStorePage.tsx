import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Store, Mail, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { storesApi } from '../../service/api';
import { StoreCharts } from '../../components/super-admin/StoreCharts';

const EditStorePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    const fetchStore = async () => {
      if (!id) return;
      try {
        const response = await storesApi.getById(id);
        if (response.data.success) {
          const store = response.data.data;
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
        } else {
          setError(response.data.message || 'Failed to fetch store details');
        }
      } catch (err: any) {
         setError(err.response?.data?.message || 'Error communicating with server');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchStore();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await storesApi.update(id, formData);
      if (response.data.success) {
        navigate('/super-admin/stores');
      } else {
        setError(response.data.message || 'Failed to update store');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error occurred during update');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium tracking-wide">Loading store configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <button 
        onClick={() => navigate('/super-admin/stores')}
        className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Stores
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{formData.name || 'Store Dashboard'}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Analytics, configuration, and identity for this branch.</p>
            </div>
          </div>
        </div>

        <div className="p-8 pb-0">
           <StoreCharts />
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form id="editStoreForm" onSubmit={handleSubmit} className="space-y-10">
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* Section: Store Details */}
            <div className="space-y-5">
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

            {/* Section: Location */}
            <div className="space-y-5">
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State/Region</label>
                  <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Zip/Postal Code</label>
                  <input name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
                </div>
              </div>
            </div>

            {/* Configuration */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <label className="flex items-center p-5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive"
                  checked={formData.isActive} 
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="ml-4">
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

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
          <button 
            type="button" 
            onClick={() => navigate('/super-admin/stores')}
            className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="editStoreForm"
            disabled={loading}
            className="px-8 py-3 bg-[#1f1e35] text-white font-bold rounded-xl hover:bg-[#2a2845] transition-colors shadow-md shadow-slate-900/10 flex items-center space-x-2"
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

export default EditStorePage;
