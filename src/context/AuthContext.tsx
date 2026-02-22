import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { validateToken, initializeStorage } from '../services/github';

interface AuthConfig {
  token: string;
  owner: string;
  repo: string;
}

interface AuthState {
  config: AuthConfig | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string, repoFullName: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = 'sdilej_auth';

function parseRepo(repoFullName: string): { owner: string; repo: string } | null {
  const parts = repoFullName.trim().split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthConfig;
        validateToken(parsed).then((valid) => {
          if (valid) {
            setConfig(parsed);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
          setIsLoading(false);
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (token: string, repoFullName: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    const parsed = parseRepo(repoFullName);
    if (!parsed) {
      setError('Neplatný formát repozitáře. Použij: vlastník/repo');
      setIsLoading(false);
      return false;
    }

    const authConfig: AuthConfig = { token: token.trim(), ...parsed };

    const valid = await validateToken(authConfig);
    if (!valid) {
      setError('Neplatný token nebo repozitář');
      setIsLoading(false);
      return false;
    }

    try {
      await initializeStorage(authConfig);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chyba inicializace');
      setIsLoading(false);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authConfig));
    setConfig(authConfig);
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('sdilej_user');
    setConfig(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        config,
        isAuthenticated: config !== null,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
