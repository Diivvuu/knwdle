export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  (process.env.NODE_ENV === 'production'
    ? 'https://api.knwdle.com'
    : 'http://localhost:4000');

export const ADMIN_BASE =
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://admin.knwdle.com'
    : 'http://localhost:3002');

export const CONNECT_BASE =
  process.env.NODE_ENV === 'production'
    ? 'https://connect.knwdle.com'
    : 'http://localhost:3001';
