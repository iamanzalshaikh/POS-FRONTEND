import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../service/api';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { Shield, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth, isAuthenticated, user: authUser } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      switch (authUser.role) {
        case 'SUPER_ADMIN': navigate('/admin/dashboard', { replace: true }); break;
        case 'STORE_ADMIN': navigate('/store-admin/dashboard', { replace: true }); break;
        case 'CASHIER': navigate('/cashier', { replace: true }); break;
        case 'ACCOUNTANT': navigate('/accountant', { replace: true }); break;
      }
    }
  }, [isAuthenticated, authUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const deviceFingerprint = await getDeviceFingerprint();
      
      // Try multiple sources for deviceId
      const deviceId = 
        localStorage.getItem('device-id') ||
        localStorage.getItem('deviceId') ||
        (() => {
          // Try to get from cashier-device Zustand storage
          try {
            const cashierDevice = localStorage.getItem('cashier-device');
            if (cashierDevice) {
              const { state } = JSON.parse(cashierDevice);
              return state?.deviceId || undefined;
            }
          } catch {}
          return undefined;
        })() ||
        undefined;
      
      console.log('[LOGIN] Attempting login:', {
        email,
        deviceId,
        deviceFingerprint: deviceFingerprint.substring(0, 16) + '...',
      });

      const response = await authApi.login({ 
        email, 
        password, 
        deviceFingerprint, 
        deviceId 
      });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;

        if (refreshToken) {
          localStorage.setItem('refresh-token', refreshToken);
        }

        // Store deviceId for cashier login persistence
        if (user.role === 'CASHIER' && deviceId) {
          localStorage.setItem('device-id', deviceId);
          console.log('[LOGIN] Device ID stored for cashier:', deviceId);
        }

        setAuth(user, accessToken);
        console.log(`[LOGIN] User Role: "${user.role}"`);
        
        switch (user.role) {
          case 'SUPER_ADMIN': navigate('/super-admin/dashboard'); break;
          case 'STORE_ADMIN': navigate('/store-admin/dashboard'); break;
          case 'CASHIER': navigate('/cashier'); break;
          case 'ACCOUNTANT': navigate('/accountant'); break;
          default: 
            console.warn(`[LOGIN] UNKNOWN ROLE: "${user.role}"`);
            navigate('/unauthorized');
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      console.error('[LOGIN] Error:', {
        status: err.response?.status,
        message: msg,
        data: err.response?.data,
      });
      
      if (err.response?.status === 403) {
        setError(msg || 'This device is not registered or you are not assigned to this terminal.');
      } else if (err.response?.status === 401) {
        setError(msg || 'Invalid email or password.');
      } else {
        setError(msg || 'Connection error. Is the backend running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 mb-6 group hover:scale-105 transition-transform cursor-pointer">
            <Shield className="text-slate-900 w-8 h-8 group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">POS <span className="text-indigo-600">SaaS</span></h1>
          <p className="text-slate-500 font-semibold tracking-wide text-sm">ENTERPRISE RESOURCE PLANNING</p>
        </div>

        <div className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-xl shadow-slate-200/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within/input:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-500 font-medium"
                  placeholder="admin@pos.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within/input:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-500 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center space-x-3 text-red-600 animate-shake shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>SIGN IN TO DASHBOARD</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm font-medium">
              Forgot password? <a href="#" className="text-indigo-600 font-bold hover:underline">Contact Support</a>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center space-x-6 text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Network Secure</span>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500">© 2026 POS SAAS</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
