import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api';
import { ParentRole } from './org';

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
  invite: InviteUI;
};

export interface InvitePreview {
  orgId: string;
  orgName: string;
  unitName?: string | null;
  invitedEmail?: string;
  parentRole?: ParentRole;
  roleName?: string | null;
  expiresAt?: string;
}

export interface AcceptInviteResponse {
  message: string;
  orgId?: string;
  unitId?: string | null;
}

type InviteUI = {
  preview: InvitePreview | null;
  previewStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  previewError?: string;

  acceptStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  acceptError?: string;
  acceptResult: AcceptInviteResponse | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
  invite: {
    preview: null,
    previewStatus: 'idle',
    acceptStatus: 'idle',
    acceptResult: null,
  },
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

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken } = res.data ?? {};
      if (accessToken) setAuthToken(accessToken);
      return { accessToken: accessToken ?? null };
    } catch (e: any) {
      console.log('refreshSession error', e?.response?.status);

      // 🔥 if refresh token invalid, force logout
      if (e.response?.status === 401) {
        await dispatch(logout()); // ✅ this actually runs the thunk
        return rejectWithValue('refresh_failed');
      }

      throw e;
    }
  }
);

export const fetchInvitePreview = createAsyncThunk<
  InvitePreview,
  { token: string }
>('auth/fetchInvitePreview', async ({ token }) => {
  const { data } = await api.get(`/auth/invites/${token}/preview`);
  return data as InvitePreview;
});

export const acceptInviteByToken = createAsyncThunk<
  AcceptInviteResponse,
  { token: string }
>('auth/acceptInviteByToken', async ({ token }) => {
  const { data } = await api.post(`/api/invites/${token}/accept`);
  return data as AcceptInviteResponse;
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
  reducers: {
    resetInviteUi(state) {
      state.invite = {
        preview: null,
        previewStatus: 'idle',
        acceptStatus: 'idle',
        acceptResult: null,
      };
    },
  },
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

    // preview reducers
    b.addCase(fetchInvitePreview.pending, (s) => {
      s.invite.previewStatus = 'loading';
      s.invite.previewError = undefined;
      s.invite.preview = null;
    });
    b.addCase(fetchInvitePreview.fulfilled, (s, a) => {
      ((s.invite.previewStatus = 'succeeded'), (s.invite.preview = a.payload));
    });
    b.addCase(fetchInvitePreview.rejected, (s, a) => {
      ((s.invite.previewStatus = 'failed'),
        (s.invite.previewError = a.error.message || 'Failed to load invite'));
      s.invite.preview = null;
    });

    // accept invite
    b.addCase(acceptInviteByToken.pending, (s) => {
      s.invite.acceptStatus = 'loading';
      s.invite.acceptError = undefined;
      s.invite.acceptResult = null;
    });
    b.addCase(acceptInviteByToken.fulfilled, (s, a) => {
      s.invite.acceptStatus = 'succeeded';
      s.invite.acceptResult = a.payload;
    });
    b.addCase(acceptInviteByToken.rejected, (s, a) => {
      ((s.invite.acceptStatus = 'failed'),
        (s.invite.acceptError = a.error.message || 'Failed to accept invite'));
    });
  },
});

export const { resetInviteUi } = authSlice.actions;
export default authSlice.reducer;
