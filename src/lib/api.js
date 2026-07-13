import axios from 'axios';
import { getCsrfToken, setCsrfToken } from './csrf.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

api.interceptors.request.use((config) => {
  if (MUTATING_METHODS.has((config.method || '').toLowerCase())) {
    const token = getCsrfToken();
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isExpiredToken = response?.status === 401 && response?.data?.code === 'TOKEN_EXPIRED';

    if (!isExpiredToken || config._retried) {
      if (response?.status === 401) unauthorizedHandler?.();
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').then((res) => {
          setCsrfToken(res.data.csrfToken);
          return res;
        }).finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return api(config);
    } catch {
      unauthorizedHandler?.();
      return Promise.reject(error);
    }
  }
);

export default api;
