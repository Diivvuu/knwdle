// apps/*/src/api.ts
import axios, { AxiosError } from 'axios';

const REFRESH_DEAD_KEY = '__knw_refresh_dead';

let accessToken: string | null = null;
let refreshing = false;
let refreshDead = false;
let loggingOut = false;
let waiters: Array<() => void> = [];

try {
  if (
    typeof window !== 'undefined' &&
    localStorage.getItem(REFRESH_DEAD_KEY) === '1'
  ) {
    refreshDead = true;
  }
} catch {}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  timeout: 15000,
});

export const beginLogout = () => {
  loggingOut = true;
};
export const endLogout = () => {
  loggingOut = false;
};

export const setAuthToken = (token?: string) => {
  accessToken = token ?? null;
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export const hardResetAuthClient = () => {
  accessToken = null;
  refreshDead = true;
  try {
    localStorage.setItem(REFRESH_DEAD_KEY, '1');
  } catch {}
  refreshing = false;
  loggingOut = false;
  waiters.forEach((r) => r());
  waiters = [];
  delete api.defaults.headers.common.Authorization;
};

export const reviveAuthClient = (token: string) => {
  refreshDead = false;
  try {
    localStorage.removeItem(REFRESH_DEAD_KEY);
  } catch {}
  setAuthToken(token);
};

/** 🔐 REQUEST GATE:
 * If no Authorization header AND refresh isn't dead:
 *  - perform one refresh (deduped) BEFORE sending the request
 * Skips /auth/* endpoints.
 */

api.interceptors.request.use(async (config) => {
  if (loggingOut) return config;

  const url = String(config.url || '');
  if (url.startsWith('/auth/')) return config;

  if (accessToken) return config; // no token? we'll still try the request; 401 handler will refresh
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original: any = err.config || {};
    const status = err.response?.status;

    if (
      original._retry ||
      loggingOut ||
      String(original.url || '').includes('/auth/refresh')
    ) {
      throw err;
    }

    if (status === 401) {
      original._retry = true;

      if (refreshing) {
        await new Promise<void>((r) => waiters.push(r));
      } else {
        try {
          refreshing = true;
          const { data } = await api.post('/auth/refresh', undefined, {
            headers: { Authorization: undefined },
          });
          const newToken = (data as any)?.accessToken;
          if (!newToken) {
            // server already cleared cookie; let caller handle logout flow
            throw err;
          }
          setAuthToken(newToken);
        } finally {
          refreshing = false;
          waiters.forEach((r) => r());
          waiters = [];
        }
      }
      return api(original);
    }

    throw err;
  }
);
