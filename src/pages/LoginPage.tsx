import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../service/api';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { setAuth, isAuthenticated, user: authUser } = useAuthStore();
  const navigate = useNavigate();

  // Load remembered credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_me_email');
    const savedRememberMe = localStorage.getItem('remember_me_check');
    if (savedEmail) setEmail(savedEmail);
    if (savedRememberMe === 'true') setRememberMe(true);
  }, []);

  // Auth Redirect logic
  useEffect(() => {
    if (isAuthenticated && authUser) {
      const routes: Record<string, string> = {
        'SUPER_ADMIN': '/super-admin/dashboard',
        'STORE_ADMIN': '/store-admin/dashboard',
        'CASHIER': '/cashier',
        'ACCOUNTANT': '/accountant',
      };
      navigate(routes[authUser.role] || '/unauthorized', { replace: true });
    }
  }, [isAuthenticated, authUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const deviceFingerprint = await getDeviceFingerprint();
      const deviceId = localStorage.getItem('device-id') || undefined;

      const response = await authApi.login({ email, password, deviceFingerprint, deviceId });

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        
        // Persistence logic
        if (rememberMe) {
          localStorage.setItem('remember_me_email', email);
          localStorage.setItem('remember_me_check', 'true');
        } else {
          localStorage.removeItem('remember_me_email');
          localStorage.setItem('remember_me_check', 'false');
        }

        if (refreshToken) localStorage.setItem('refresh-token', refreshToken);
        setAuth(user, accessToken);
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 selection:bg-indigo-100">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-100/50 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-8">
          <img 
            src="/zoriva-pos-logo.png" 
            alt="Logo" 
            className="h-35 mx-auto mb-4 drop-shadow-sm hover:scale-105 transition-transform duration-500" 
          />
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Smart Retail Management System</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 md:p-10 relative">
          {/* Top accent bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-b-full"></div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-12 py-3.5 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center px-1">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                  {rememberMe && <ShieldCheck className="text-white w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <span className="ml-3 text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-600 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_15px_25px_rgba(79,70,229,0.3)] active:scale-[0.97] flex items-center justify-center space-x-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="tracking-[0.1em] text-sm">SIGN IN TO SYSTEM</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700">System Secure</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            © 2026 POS SAAS • v2.4.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;