import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, profileApi, devicesApi } from '../service/api';
import { type AuthState } from '../types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      
      setAuth: (user, accessToken) => set({ 
        user, 
        accessToken, 
        isAuthenticated: true,
        isLoading: false 
      }),
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false
      }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          if (response.data.success) {
            const { user, accessToken, refreshToken } = response.data.data;
            localStorage.setItem('refresh-token', refreshToken);
            set({ user, accessToken, isAuthenticated: true, isLoading: false });
            return { success: true };
          }
          set({ isLoading: false });
          return { success: false, message: response.data.message || 'Login failed' };
        } catch (error: any) {
          set({ isLoading: false });
          return { 
            success: false, 
            message: error.response?.data?.message || 'Invalid email or password' 
          };
        }
      },
      
      logout: async () => {
        try {
          try {
            await devicesApi.release();
          } catch {
            // Ignore - user may not be cashier/accountant
          }
          const refreshToken = localStorage.getItem('refresh-token');
          await authApi.logout(refreshToken || undefined);
          console.log('[AUTH] ✅ Logout API successful');
        } catch (error) {
          console.error('[AUTH] Logout API error:', error);
        } finally {
          localStorage.removeItem('refresh-token');
          set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
          console.log('[AUTH] ✅ Global state cleared');
        }
      },
      
      hydrate: async () => {
        try {
          // 1. Initial State Check
          const currentState = get();
          const token = currentState.accessToken;
          const authStorage = localStorage.getItem('auth-storage');
          
          if (!token || !authStorage) {
            console.log('[AUTH] No persisted token, user unauthenticated');
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // 2. FAST-PATH: Set loading to false immediately if we have a persisted session
          // This allows the UI to render and parallelize other requests while we verify the token
          set({ isLoading: false, isAuthenticated: true });
          console.log('[AUTH] Fast-path hydration: UI unlocked, validating session in background...');

          // 3. BACKGROUND SYNC: Verify session with backend
          try {
            const response = await profileApi.getProfile();
            
            if (response.data?.success && response.data?.data) {
              const userData = response.data.data.user;
              console.log('✅ [AUTH] Background session synchronization complete. User:', userData.email);
              set({ 
                user: userData, 
                isAuthenticated: true,
                isLoading: false
              });
            } else {
              throw new Error('Malformed profile response');
            }
          } catch (error: any) {
            const status = error.response?.status;
            console.warn('⚠️ [AUTH] Background hydration warning:', error.response?.data?.message || error.message);
            
            if (status === 401 || status === 403) {
              console.error('🚫 [AUTH] Session invalid, logging out...');
              // Token is invalid/expired
              set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
              localStorage.removeItem('refresh-token');
              localStorage.removeItem('auth-storage');
              window.location.href = '/login';
            } else {
              // Network error or server issues - we keep the persisted user for offline/stale access
              console.warn('[AUTH] Session validation failed but keeping persisted state for offline resilience');
              set({ isLoading: false });
            }
          }
        } catch (error) {
          console.error('[AUTH] Root hydration failure:', error);
          set({ isLoading: false, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
