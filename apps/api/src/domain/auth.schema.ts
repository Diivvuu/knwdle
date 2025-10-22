// src/domain/auth.schema.ts
import { z } from 'zod';

export const SignupBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const RequestOtpBody = z.object({
  email: z.string().email(),
});

export const VerifyOtpBody = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(10),
});
export const AuthError = z.object({ error: z.string() });
export const AuthBasicMessage = z.object({ message: z.string() });

export const AuthUser = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
});

export const AuthAccessResponse = z.object({
  accessToken: z.string(),
  user: AuthUser,
});

// For /auth/verify success payload
export const VerifyEmailResponse = z.object({
  message: z.string(),
  accessToken: z.string(),
  user: AuthUser,
});

// For /auth/refresh success payload
export const RefreshResponse = z.object({
  accessToken: z.string(),
});
export type SignupDTO = z.infer<typeof SignupBody>;
export type LoginDTO = z.infer<typeof LoginBody>;
export type RequestOtpDTO = z.infer<typeof RequestOtpBody>;
export type VerifyOtpDTO = z.infer<typeof VerifyOtpBody>;