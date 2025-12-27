// apps/*/src/api.ts
import axios, { AxiosError } from 'axios';

const REFRESH_DEAD_KEY = '__knw_refresh_dead';

let accessToken: string | null = null;
let refreshing = false;
let refreshDead = false;
let loggingOut = false;

type QueuedRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  config: any;
};
let queue: QueuedRequest[] = [];
let refreshPromise: Promise<string | null> | null = null;

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
  queue.forEach((q) => q.reject(new Error('logout')));
  queue = [];
  refreshPromise = null;
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
      original._skipAuthRefresh ||
      String(original.url || '').includes('/auth/refresh')
    ) {
      throw err;
    }

    if (status === 401) {
      original._retry = true;

      const enqueue = () =>
        new Promise((resolve, reject) => {
          queue.push({ resolve, reject, config: original });
        });

      const triggerRefresh = async () => {
        try {
          refreshing = true;
          const { data } = await api.post(
            '/auth/refresh',
            undefined,
            {
              headers: { Authorization: undefined },
              _skipAuthRefresh: true,
            } as any
          );
          const newToken = (data as any)?.accessToken ?? null;
          if (!newToken) throw err;
          setAuthToken(newToken);
          return newToken;
        } finally {
          refreshing = false;
        }
      };

      if (!refreshPromise) {
        refreshPromise = triggerRefresh()
          .then((token) => {
            const pending = queue;
            queue = [];
            pending.forEach((p) => p.resolve(api(p.config)));
            return token;
          })
          .catch((e) => {
            const pending = queue;
            queue = [];
            pending.forEach((p) => p.reject(e));
            throw e;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      return enqueue();
    }

    throw err;
  }
);
