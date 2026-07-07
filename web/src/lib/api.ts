import axios from 'axios';
import { API_URL } from './constants';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' }, withCredentials: true, timeout: 60000 });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); if (typeof window !== 'undefined') window.location.href = '/auth/login'; }
    }
    return Promise.reject(error);
  }
);

export default api;
