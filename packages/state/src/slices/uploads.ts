import {
  createAsyncThunk,
  createSlice,
  nanoid,
  PayloadAction,
} from '@reduxjs/toolkit';

import { api } from '../api';

/** Same kinds your route supports */
export type UploadKind = 'org-logo' | 'org-cover' | 'misc';

export type UploadStatus =
  | 'idle'
  | 'loading'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type UploadRecord = {
  id: string;
  fileName: string;
  kind: UploadKind;
  status: UploadStatus;
  progress: number; // 0-100
  key?: string;
  error?: string;
};

export type UploadState = {
  byId: Record<string, UploadRecord>;
};

const initialState: UploadState = { byId: {} };

/** ---------------- helpers ---------------- */
function sniffContentType(file: File) {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

/** Request presigned POST from our API */
async function presign(
  file: File,
  kind: UploadKind,
  apiBase = ''
): Promise<{
  url: string;
  fields: Record<string, string>;
  key: string;
}> {
  const contentType = sniffContentType(file);
  const { data } = await api.post(`${apiBase}/api/uploads/presign`, {
    filename: file.name,
    contentType,
    kind,
  });
  return data;
}

/** Upload to S3 with XHR so we can report progress */
function uploadToS3(
  url: string,
  fields: Record<string, string>,
  file: File,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const pct = Math.round((e.loaded / e.total) * 100);
      onProgress?.(pct);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Network error during S3 upload'));
    xhr.onabort = () =>
      reject(
        Object.assign(new Error('Upload canceled'), { name: 'AbortError' })
      );

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return reject(
          Object.assign(new Error('Upload canceled'), { name: 'AbortError' })
        );
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(form);
  });
}

/** ---------------- Thunk (simple like auth slice) ---------------- */
export const uploadImage = createAsyncThunk<
  // return
  { id: string; key: string },
  // arg
  { id: string; file: File; kind?: UploadKind; apiBase?: string },
  // thunkApi
  { rejectValue: string }
>('uploads/uploadImage', async (arg, { dispatch, rejectWithValue }) => {
  const { id, file, kind = 'misc', apiBase = '' } = arg;

  try {
    const { url, fields, key } = await presign(file, kind, apiBase);

    // progress updates via a tiny action
    await uploadToS3(url, fields, file, (pct) =>
      dispatch(setProgress({ id, progress: pct }))
    );

    return { id, key };
  } catch (e: any) {
    return rejectWithValue(e?.message || 'Upload failed');
  }
});

/** ---------------- Slice ---------------- */
const uploadsSlice = createSlice({
  name: 'uploads',
  initialState,
  reducers: {
    setProgress(
      state,
      action: PayloadAction<{ id: string; progress: number }>
    ) {
      const rec = state.byId[action.payload.id];
      if (rec)
        rec.progress = Math.max(0, Math.min(100, action.payload.progress));
    },
    resetUpload(state, action: PayloadAction<{ id: string }>) {
      delete state.byId[action.payload.id];
    },
  },
  extraReducers: (b) => {
    b.addCase(uploadImage.pending, (s, a) => {
      const { id, file, kind = 'misc' } = a.meta.arg;
      s.byId[id] = {
        id,
        fileName: file.name,
        kind,
        status: 'loading',
        progress: 0,
      };
    });

    b.addCase(uploadImage.fulfilled, (s, a) => {
      const { id, key } = a.payload;
      const rec = s.byId[id];
      if (!rec) return;
      rec.status = 'succeeded';
      rec.progress = 100;
      rec.key = key;
    });

    b.addCase(uploadImage.rejected, (s, a) => {
      const { id } = a.meta.arg;
      const rec = s.byId[id];
      if (!rec) return;
      rec.status = 'failed';
      rec.error = (a.payload as string) || a.error.message || 'Upload failed';
    });
  },
});

export const { setProgress, resetUpload } = uploadsSlice.actions;
export default uploadsSlice.reducer;
// also export a named one for convenient imports
export const uploadsReducer = uploadsSlice.reducer;

/** ---------------- Selectors ---------------- */
/** ---------------- Selectors (null-safe) ---------------- */
export const selectUpload = (state: any, id: string) => {
  const slice = (state as any)?.uploads as UploadState | undefined;
  return slice?.byId?.[id];
};

export const selectUploads = (state: any) => {
  const slice = (state as any)?.uploads as UploadState | undefined;
  return slice?.byId ?? {};
};
