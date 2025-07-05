export const SERVER_URL =
  import.meta.env.VITE_VERCEL_TARGET_ENV === 'production'
    ? 'https://thep33l-thep33l.up.railway.app'
    : import.meta.env.VITE_VERCEL_TARGET_ENV === 'preview'
      ? 'https://thep33l-staging.up.railway.app'
      : 'http://localhost:8000';
