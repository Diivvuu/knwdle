import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  api,
  beginLogout,
  hardResetAuthClient,
  reviveAuthClient,
  setAuthToken,
} from '../api';
import { ParentRole } from './roles';

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
  otp: {
    status: 'idle' | 'sending' | 'sent' | 'verifying' | 'failed';
    error?: string;
    email?: string;
  };
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
  otp: { status: 'idle' },
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
    reviveAuthClient(accessToken);
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
    reviveAuthClient(accessToken);
    return { accessToken, user };
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken } = res.data ?? {};
      // if (accessToken) reviveAuthClient(accessToken);
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
  { token: string },
  { rejectValue: string }
>('auth/fetchInvitePreview', async ({ token }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/auth/invites/${token}/preview`);
    return data as InvitePreview;
  } catch (err: any) {
    const status = err.response?.status;
    const message =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      'Failed to load invite';

    // ✅ Preserve 403 forbidden message for frontend display
    if (status === 403) {
      return rejectWithValue(message || 'This invite is for another email');
    }

    return rejectWithValue(message);
  }
});

export const acceptInviteByToken = createAsyncThunk<
  AcceptInviteResponse,
  { token: string }
>('auth/acceptInviteByToken', async ({ token }) => {
  const { data } = await api.post(`/api/invites/${token}/accept`);
  return data as AcceptInviteResponse;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    beginLogout();
    await api.post('/auth/logout');
  } finally {
    hardResetAuthClient();
    try {
      localStorage.removeItem('accessToken');
    } catch {}
    try {
      sessionStorage.clear();
    } catch {}
  }
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
    clearAuthError(s) {
      s.error = undefined;
    },
    clearOtpError(s) {
      s.otp.error = undefined;
    },
  },
  extraReducers: (b) => {
    //signup
    b.addCase(signup.pending, (s) => {
      s.status = 'loading';
      s.error = undefined;
    });
    b.addCase(signup.fulfilled, (s) => {
      s.status = 'idle';
    });
    b.addCase(signup.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message;
    });

    //password login
    b.addCase(login.pending, (s) => {
      s.status = 'loading';
      s.error = undefined;
    });
    b.addCase(login.fulfilled, (s, a) => {
      s.status = 'idle';
      s.accessToken = a.payload.accessToken;
      s.user = a.payload.user;
    });
    b.addCase(login.rejected, (s, a) => {
      s.status = 'failed';
      s.error = a.error.message;
    });

    //otp request
    b.addCase(requestOtp.pending, (s, a) => {
      s.otp.status = 'sending';
      s.otp.error = undefined;
      s.otp.email = (a.meta.arg as { email: string }).email;
    });
    b.addCase(requestOtp.fulfilled, (s) => {
      s.otp.status = 'sent';
    });
    b.addCase(requestOtp.rejected, (s, a) => {
      s.otp.status = 'failed';
      s.otp.error = a.error.message || 'Failed to send OTP';
    });

    //verify otp
    b.addCase(verifyOtp.pending, (s) => {
      s.otp.status = 'verifying';
      s.otp.error = undefined;
    });
    b.addCase(verifyOtp.fulfilled, (s, a) => {
      s.otp.status = 'idle';
      s.accessToken = a.payload.accessToken;
      s.user = a.payload.user;
    });
    b.addCase(verifyOtp.rejected, (s, a) => {
      s.otp.status = 'failed';
      s.otp.error = a.error.message;
    });

    //refresh/logout/me (unchanged)
    b.addCase(refreshSession.fulfilled, (s, a) => {
      if (a.payload.accessToken) s.accessToken = a.payload.accessToken;
    });
    b.addCase(logout.fulfilled, (s) => {
      s.accessToken = null;
      s.user = null;
      s.otp = { status: 'idle' };
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
      s.invite.previewStatus = 'failed';
      s.invite.previewError =
        (a.payload as string) || a.error.message || 'Failed to load invite';
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

export const { resetInviteUi, clearAuthError, clearOtpError } =
  authSlice.actions;
export default authSlice.reducer;
