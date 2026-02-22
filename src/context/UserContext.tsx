import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserState | null>(null);

const STORAGE_KEY = 'sdilej_user';

function loadStoredUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(loadStoredUser);

  const setCurrentUser = useCallback((user: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUserState(user);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
