import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '../types';

interface UserState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  clearUser: () => void;
  syncWithLiveData: (users: Record<string, User>) => void;
}

const UserContext = createContext<UserState | null>(null);

const STORAGE_KEY = 'colabala_user';

function loadStoredUser(): User | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const user = JSON.parse(stored) as User;
    if (!user.role) user.role = 'user';
    return user;
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

  // Sync stored user with live server data (role, name, color may have changed)
  const syncWithLiveData = useCallback((users: Record<string, User>) => {
    setCurrentUserState((prev) => {
      if (!prev) return null;
      const live = users[prev.id];
      if (!live) return prev;
      // Only update if something actually changed
      if (live.name === prev.name && live.color === prev.color && live.role === prev.role) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
      return live;
    });
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, clearUser, syncWithLiveData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}
