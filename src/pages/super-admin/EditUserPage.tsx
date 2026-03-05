import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { usersApi } from '../../service/api';

const EditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STORE_ADMIN',
    isActive: true,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        // Here we ideally need an API endpoint to fetch a single user, e.g. usersApi.getById(id)
        // For now, we fetch all users and filter, since we don't have a getById in usersApi yet.
        const response = await usersApi.getAll();
        if (response.data.success) {
          const user = response.data.data.find((u: any) => u.id === id);
          if (user) {
             setFormData({
              name: user.name || '',
              email: user.email || '',
              role: user.role || 'STORE_ADMIN',
              isActive: user.isActive !== undefined ? user.isActive : true,
            });
          } else {
             setError('User not found');
          }
        } else {
          setError(response.data.message || 'Failed to load user details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error communicating with server');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.update(id, formData);
      if (response.data.success) {
        navigate('/super-admin/admins');
      } else {
        setError(response.data.message || 'Failed to update user');
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
        <p className="text-slate-500 font-medium tracking-wide">Loading administrator configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <button 
        onClick={() => navigate('/super-admin/admins')}
        className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Global User Management
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-8 py-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Administrator</h1>
              <p className="text-sm font-medium text-slate-500 mt-1">Update details for {formData.name}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <form id="editUserForm" onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-red-600">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <User size={14} className="mr-1" /> Full Name
                </label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Mail size={14} className="mr-1" /> Email Address
                </label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400 font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <Shield size={14} className="mr-1" /> Administrative Role
                </label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium appearance-none">
                  <option value="STORE_ADMIN">Branch Store Admin</option>
                  <option value="ACCOUNTANT">Chief Accountant</option>
                  <option value="CASHIER">Cashier</option>
                </select>
              </div>
            </div>

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
                    Account Status: {formData.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <span className="block text-xs text-slate-500 font-medium mt-0.5">
                    {formData.isActive ? 'User can log in and access authorized systems.' : 'User is locked out of the system.'}
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
            onClick={() => navigate('/super-admin/admins')}
            className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="editUserForm"
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

export default EditUserPage;
