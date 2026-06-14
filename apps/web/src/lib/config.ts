export const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000');
