// utils/auth.ts
export const isUserLoggedIn = (): boolean => {
  if (typeof window === 'undefined') return false; // SSR safe
  return !!localStorage.getItem('token'); // token saved after login
};
