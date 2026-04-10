import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../service/api';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { Shield, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('remember_me_email');
    const savedRememberMe = localStorage.getItem('remember_me_check');
    
    if (savedEmail) {
      setEmail(savedEmail);
    }
    if (savedRememberMe === 'true') {
      setRememberMe(true);
    }
  }, []);

  const { setAuth, isAuthenticated, user: authUser } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      switch (authUser.role) {
        case 'SUPER_ADMIN': navigate('/super-admin/dashboard', { replace: true }); break;
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

        // Handle Remember Me persistence
        if (rememberMe) {
          localStorage.setItem('remember_me_email', email);
          localStorage.setItem('remember_me_check', 'true');
        } else {
          localStorage.removeItem('remember_me_email');
          localStorage.setItem('remember_me_check', 'false');
        }

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 mb-6 group hover:scale-105 transition-transform cursor-pointer">
            <Shield className="text-white w-8 h-8 group-hover:rotate-12 transition-transform" />
          </div>
          <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight mb-1">POS <span className="text-slate-900">SaaS</span></h1>
          <p className="text-slate-500 font-semibold tracking-wider text-[11px] uppercase">Enterprise Resource Planning</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-7 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 relative overflow-hidden ring-1 ring-slate-100">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-500"></div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within/input:text-indigo-600 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 pl-11 pr-4 py-3 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="admin@pos.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 group-focus-within/input:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 pl-11 pr-12 py-3 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-200 rounded-md bg-white peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                    <svg className={`w-3.5 h-3.5 text-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="text-[13px] font-semibold text-slate-500 group-hover:text-slate-600 transition-colors">Remember me</span>
              </label>
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
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-[13px] font-bold py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="tracking-widest capitalize">Authenticating...</span>
                </>
              ) : (
                <span className="tracking-widest font-bold">SIGN IN TO DASHBOARD</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-400 text-[12px] font-medium">
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
