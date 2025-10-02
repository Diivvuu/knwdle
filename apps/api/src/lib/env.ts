// src/lib/env.ts
import { z } from 'zod';

const csv = z.string().transform((v) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // App
  AUTH_ORIGIN: z.string().url().optional(),
  API_URL: z.string().url().optional(),

  // Auth
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  ACCESS_EXPIRES_MIN: z.coerce.number().default(15),
  REFRESH_EXPIRES_DAYS: z.coerce.number().default(30),

  COOKIE_NAME: z.string().default('__knwdle_session'),
  COOKIE_DOMAIN: z.string().default('localhost'),

  // Mail (SMTP)
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  MAIL_FROM: z.string().default('Knwdle <divyanshu@knwdle.com>'),

  CORS_ORIGINS: csv.default('http://localhost:3000'),
});

export const env = EnvSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
