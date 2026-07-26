import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './constants';

// Extend config type to include our custom _retry flag
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 60000,
});

// ── Token Refresh Queue ──────────────────────────────────────────
// Prevents race conditions when multiple requests fail with 401
// simultaneously by queuing retries behind a single refresh attempt.

let isRefreshing = false;
type QueueEntry = {
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
};
let failedQueue: QueueEntry[] = [];

function processQueue(error: unknown, accessToken: string | null = null): void {
  failedQueue.forEach((entry) => {
    if (error || !accessToken) {
      entry.reject(error);
    } else {
      entry.resolve(accessToken);
    }
  });
  failedQueue = [];
}

// ── Request Interceptor ───────────────────────────────────────────
// Attaches the current access token to every outgoing request.

api.interceptors.request.use(async (config) => {
  const { useAuthStore } = await import('@/store/authStore');
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ──────────────────────────────────────────
// On a 401 response:
//   1. If a refresh is already in-flight, queue this request.
//   2. Otherwise, attempt a single token refresh and replay all
//      queued requests with the new token.
//   3. If the refresh fails, reject all queued requests and log out.

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

    // Only attempt refresh on 401 responses that haven't been retried yet
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // A refresh is already in progress — queue this request
    if (isRefreshing) {
      return new Promise<unknown>((resolve, reject) => {
        failedQueue.push({
          resolve: (accessToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    // This is the first 401 — start the refresh flow
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { useAuthStore } = await import('@/store/authStore');
      const store = useAuthStore.getState();
      const refreshToken = store.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
      const newAccess: string = data.data?.accessToken;
      const newRefresh: string = data.data?.refreshToken || refreshToken;

      // Persist the new tokens
      store.setTokens(newAccess, newRefresh);

      // Replay all queued requests with the fresh token
      processQueue(null, newAccess);

      // Retry the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — reject everything & force logout
      processQueue(refreshError, null);

      try {
        const { useAuthStore } = await import('@/store/authStore');
        useAuthStore.getState().logout();
      } catch {
        // authStore may not be available during SSR
      }

      // Only redirect in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
