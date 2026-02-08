// utils/auth.ts
export const isUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false; // SSR safe
  // Accept either the canonical 'auth_token' or legacy 'token'
  return !!(localStorage.getItem('auth_token') || localStorage.getItem('token'));
};
