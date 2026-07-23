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
          useAuthStore.getState().setTokens(data.data.accessToken, data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
