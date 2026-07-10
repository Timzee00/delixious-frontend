import axios from 'axios';
import { getCsrfToken } from './csrf.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Auth now lives in httpOnly cookies, not a token we attach ourselves -
  // this tells the browser to send/accept them on cross-origin requests.
  withCredentials: true,
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

// Echo the (non-httpOnly) csrf_token cookie back as a header on every
// state-changing request. Re-read fresh each time (not cached) since the
// backend rotates this token on every login/signup/refresh.
api.interceptors.request.use((config) => {
  if (MUTATING_METHODS.has((config.method || '').toLowerCase())) {
    const token = getCsrfToken();
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

// AuthContext registers a callback here so this module - which AuthContext
// itself depends on - can tell it "the session is really gone" without a
// circular import back into AuthContext.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

// Multiple requests can 401 with an expired token at the same moment
// (e.g. a page that fires several API calls on load). Without this, each
// one would kick off its own /auth/refresh call, racing to rotate the same
// refresh token. This makes every concurrent 401 share one in-flight refresh.
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
        refreshPromise = api.post('/auth/refresh').finally(() => {
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
