import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3005/api/v1',
  withCredentials: true,
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state?.accessToken) {
        if (config.headers && typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${state.accessToken}`);
        } else {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    } catch (e) {
      console.error('Error parsing auth-storage', e);
    }
  }

  // Log all API requests for debugging
  if (config.url?.includes('/sales') || config.url?.includes('/products')) {
    console.log('🌐 [API Interceptor] Outgoing request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: config.headers,
      hasAuth: !!config.headers.Authorization,
      data: config.data,
    });
  }

  return config;
});

// Response Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const { state } = JSON.parse(authStorage);
          const refreshToken = localStorage.getItem('refresh-token');

          if (refreshToken) {
            console.log('[API] Attempting token refresh...');
            const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
              refreshToken
            });

            if (response.data.success) {
              const { accessToken, refreshToken: newRefreshToken } = response.data.data;
              console.log('[API] ✅ Token refreshed successfully');

              const newState = { ...JSON.parse(authStorage), state: { ...state, accessToken } };
              localStorage.setItem('auth-storage', JSON.stringify(newState));
              localStorage.setItem('refresh-token', newRefreshToken);

              if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
                originalRequest.headers.set('Authorization', `Bearer ${accessToken}`);
              } else {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return api(originalRequest);
            }
          } else {
            console.warn('[API] No refresh token available');
          }
        }
      } catch (refreshError: any) {
        console.error('[API] ❌ Refresh token failed:', refreshError.response?.data?.message || refreshError.message);
        // Clear auth state on refresh failure
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('refresh-token');
        // Optionally redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken?: string) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

export const profileApi = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/me', data),
};

export const storesApi = {
  getAll: () => api.get('/stores'),
  getById: (id: string) => api.get(`/stores/${id}`),
  create: (data: any) => api.post('/stores', data),
  update: (id: string, data: any) => api.patch(`/stores/${id}`, data),
};

export const usersApi = {
  getAll: (storeId?: string) => api.get(storeId ? `/users?storeId=${storeId}` : '/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

export const devicesApi = {
  getAll: (storeId?: string) => api.get(storeId ? `/devices?storeId=${storeId}` : '/devices'),
  register: (data: any) => api.post('/devices', data),
  update: (id: string, data: any) => api.patch(`/devices/${id}`, data),
  heartbeat: (id: string) => api.patch(`/devices/${id}/heartbeat`),
  release: () => api.patch('/devices/release'),
};

export const terminalsApi = {
  register: (data: { terminalName: string; deviceFingerprint: string }) =>
    api.post('/terminals/register', data),
  list: () => api.get('/terminals'),
  check: (fingerprint: string) => api.get(`/terminals/check?fingerprint=${encodeURIComponent(fingerprint)}`),
  assignCashier: (terminalId: string, userId: string) =>
    api.post(`/terminals/${terminalId}/assign`, { userId }),
  unassignCashier: (terminalId: string, userId: string) =>
    api.delete(`/terminals/${terminalId}/assign/${userId}`),
  listCashiers: (terminalId: string) => api.get(`/terminals/${terminalId}/cashiers`),
};

export const reportsApi = {
  getSuperAdminOverview: () => api.get('/reports/superadmin/overview'),
  getSalesReport: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/sales', { params }),
  getAuditLogs: (params: {
    entity?: string;
    action?: string;
    limit?: number;
    page?: number;
    startDate?: string;
    endDate?: string;
    storeId?: string;
    userId?: string;
  }) => api.get('/reports/audit-logs', { params }),
  getHealth: () => api.get('/health'),
};

export default api;
