
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useData } from './DataContext';
import bcrypt from 'bcryptjs';

// Use bcryptjs in renderer (pure JS) for hashing/verification
const bcryptCompare = (password: string, hash: string) => {
  try { return bcrypt.compareSync(password, hash); } catch { return false; }
};
const bcryptHash = (password: string) => bcrypt.hashSync(password, 10);

const PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'view_reports',
    'manage_users',
    'delete_products',
    'delete_categories',
    'add_product',
    'add_category',
  ],
  cashier: [
    'add_product',
    'add_category',
  ],
};

export type Permission = 
  | 'view_reports'
  | 'manage_users'
  | 'delete_products'
  | 'delete_categories'
  | 'add_product'
  | 'add_category';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  can: (permission: Permission) => boolean;
  cannot: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { users, updateUser } = useData();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('pos_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
      sessionStorage.removeItem('pos_user');
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.username === username);
    if (!foundUser) return false;

    // Check lockout
    if ((foundUser.failed_login_attempts || 0) >= 5) {
      return false;
    }

    const ok = bcryptCompare(password, foundUser.passwordHash);
    if (ok) {
      // reset failed attempts and update last_login
      try {
        const updated: User = { ...foundUser, failed_login_attempts: 0, last_login: new Date().toISOString() } as User;
        updateUser(updated);
      } catch (e) {
        // ignore update errors
      }
      const session = { userId: foundUser.id, token: Date.now().toString(36) + Math.random().toString(36).slice(2), expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString() };
      sessionStorage.setItem('pos_user', JSON.stringify(foundUser));
      sessionStorage.setItem('pos_session', JSON.stringify(session));
      setUser(foundUser);
      return true;
    } else {
      // increment failed attempts
      try {
        const updated: User = { ...foundUser, failed_login_attempts: (foundUser.failed_login_attempts || 0) + 1, last_failed_login: new Date().toISOString() } as User;
        updateUser(updated);
      } catch (e) {}
      return false;
    }
  }, [users, updateUser]);


  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('pos_user');
  };

  const isAuthenticated = !!user;

  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(permission) ?? false;
  }, [user]);

  const cannot = useCallback((permission: Permission): boolean => {
    return !can(permission);
  }, [can]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, can, cannot }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
