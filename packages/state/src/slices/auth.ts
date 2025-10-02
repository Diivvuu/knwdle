import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api';

export interface MemberShipSummary {
  org: { id: string; name: string; type: string };
  role: string | null;
}
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  memberships?: MemberShipSummary[];
}

export type AuthState = {
  user: User | null;
  accessToken: string | null; // rename for clarity
  status: 'idle' | 'loading' | 'failed';
  error?: string;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
};

export const signup = createAsyncThunk(
  'auth/signup',
  async (data: { email: string; password: string; name?: string }) => {
    const res = await api.post('/auth/signup', data);
    return res.data; // if backend also sends token, handle below
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }) => {
    const res = await api.post('/auth/login', data);
    const { accessToken, user } = res.data;
    setAuthToken(accessToken);
    return { accessToken, user };
  }
);

export const requestOtp = createAsyncThunk(
  'auth/requestOtp',
  async (data: { email: string }) => {
    const res = await api.post('/auth/request-otp', data);
    return res.data;
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data: { email: string; code: string }) => {
    const res = await api.post('/auth/verify-otp', data); // <-- fixed
    const { accessToken, user } = res.data;
    setAuthToken(accessToken);
    return { accessToken, user };
  }
);

export const refreshSession = createAsyncThunk('auth/refresh', async () => {
  const res = await api.post('/auth/refresh');
  const { accessToken } = res.data ?? {};
  if (accessToken) setAuthToken(accessToken); // only if API returns token
  return { accessToken: accessToken ?? null };
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
  setAuthToken(undefined);
  return {};
});

export const getMe = createAsyncThunk('auth/getMe', async () => {
  const res = await api.get('/auth/me');
  return res.data as User;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(login.fulfilled, (s, a) => {
      s.accessToken = a.payload.accessToken;
      s.user = a.payload.user;
    });
    b.addCase(verifyOtp.fulfilled, (s, a) => {
      s.accessToken = a.payload.accessToken;
      s.user = a.payload.user;
    });
    b.addCase(refreshSession.fulfilled, (s, a) => {
      if (a.payload.accessToken) s.accessToken = a.payload.accessToken;
    });
    b.addCase(logout.fulfilled, (s) => {
      s.accessToken = null;
      s.user = null;
    });
    b.addCase(getMe.fulfilled, (s, a) => {
      s.user = s.user ? { ...s.user, ...a.payload } : a.payload;
    });
  },
});

export default authSlice.reducer;
