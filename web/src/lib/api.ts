import axios from 'axios';
import { API_URL } from './constants';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, withCredentials: true, timeout: 60000 });

api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('@/store/authStore');
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { useAuthStore } = await import('@/store/authStore');
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const newAccess = data.data.accessToken;
          const newRefresh = data.data.refreshToken || refreshToken;
          useAuthStore.getState().setTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch (refreshErr: any) {
        const status = refreshErr.response?.status;
        if (status === 401 || status === 403) {
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.getState().logout();
          if (typeof window !== 'undefined') window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
