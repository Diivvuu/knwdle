// apps/*/src/api.ts
import axios, { AxiosError } from 'axios';

let accessToken: string | null = null;
let refreshing = false;
let refreshDead = false;
let loggingOut = false;
let waiters: Array<() => void> = [];

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
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as any;
    const status = err.response?.status;

    // 🔒 stop recursion or work during logout
    if (
      original?._retry ||
      original?.url?.includes('/auth/refresh') ||
      loggingOut ||
      refreshDead
    ) {
      throw err;
    }

    // ⛔ if it's any 401, even with a token, try one refresh max
    if (status === 401) {
      // case 1: we have a token → probably expired/bad
      // case 2: no token → maybe cookie refreshable
      original._retry = true;

      if (refreshing) {
        await new Promise<void>((r) => waiters.push(r));
      } else {
        try {
          refreshing = true;
          const { data } = await api.post('/auth/refresh'); // cookie → new token
          const newToken = (data as any)?.accessToken;
          if (!newToken) {
            // refresh endpoint responded but gave nothing → treat as failure
            refreshDead = true;
            throw err;
          }
          setAuthToken(newToken);
        } catch {
          // ❌ refresh failed (wrong token or no cookie) → never try again
          refreshDead = true;
          waiters.forEach((r) => r());
          waiters = [];
          refreshing = false;
          throw err;
        }
        waiters.forEach((r) => r());
        waiters = [];
        refreshing = false;
      }

      // ✅ only one retry per request
      return api(original);
    }

    throw err;
  }
);
