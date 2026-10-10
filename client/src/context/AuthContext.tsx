import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { TOKEN_KEY } from '../api/client';
import { getMeRequest, loginRequest, registerRequest } from '../api/auth.api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean; // true while we verify a stored token on first load
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem(TOKEN_KEY));

  // On first load: if a token is stored, ask the server who it belongs to
  useEffect(() => {
    if (!token) return;
    getMeRequest()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest({ email, password });
    saveSession(data.token, data.user);
  }, [saveSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await registerRequest({ name, email, password });
    saveSession(data.token, data.user);
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook: components call useAuth() instead of useContext(AuthContext) everywhere
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}