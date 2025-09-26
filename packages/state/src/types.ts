// types.ts
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

/**
 * These are placeholders.
 * Each app must override them by declaration merging (or their own types).
 */
export type RootState = any; // better than unknown, avoids TS constraint errors
export type AppDispatch = Dispatch<UnknownAction>;
