import axios, { AxiosError } from 'axios';

let accessToken: string | null = null;
let refreshing = false;
let waiters: Array<() => void> = [];

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true, // send refresh cookie
  timeout: 15000,
});

export const setAuthToken = (token?: string) => {
  accessToken = token ?? null;
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

api.interceptors.request.use((config) => {
  // We rely on api.defaults.headers.Authorization set via setAuthToken()
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as any;
    if (err.response?.status === 401 && !original?._retry) {
      original._retry = true;

      if (refreshing) {
        await new Promise<void>((r) => waiters.push(r));
      } else {
        try {
          refreshing = true;
          const { data } = await api.post('/auth/refresh'); // cookie -> new token
          const newToken = (data as any)?.accessToken;
          if (newToken) setAuthToken(newToken);
        } catch {
          setAuthToken(undefined);
          waiters.forEach((r) => r());
          waiters = [];
          refreshing = false;
          throw err;
        }
        waiters.forEach((r) => r());
        waiters = [];
        refreshing = false;
      }
      return api(original); // retry with fresh token
    }
    throw err;
  }
);
