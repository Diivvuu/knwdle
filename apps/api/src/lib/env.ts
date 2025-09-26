// src/lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // App
  API_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),

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
});

export const env = EnvSchema.parse(process.env);
export const isProd = env.NODE_ENV === 'production';
