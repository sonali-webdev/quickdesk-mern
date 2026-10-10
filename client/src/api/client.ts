import axios from 'axios';

export const TOKEN_KEY = 'quickdesk_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our token is bad, clear it and send the user to login.
// Skip this for the login/register calls themselves: a 401 there just means wrong credentials.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthCall = url.startsWith('/auth/login') || url.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Pull a readable message out of our server's { message } error shape
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Cannot reach the server';
  }
  return 'Something went wrong';
}