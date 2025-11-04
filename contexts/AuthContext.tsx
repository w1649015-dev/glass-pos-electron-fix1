import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { useDatabase } from '@/contexts/DatabaseContext';
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
  const { 
    users,
    getUsers,
    authenticateUser,
    createUser,
  } = useDatabase();

  useEffect(() => {
    // Load users from database when component mounts
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      await getUsers();
    } catch (error) {
      console.error("Failed to load users from database", error);
    }
  };

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
    try {
      // Use the database service authenticateUser for verification
      const foundUser = await authenticateUser(username, password);
      if (!foundUser) return false;

      const session = { 
        userId: foundUser.id, 
        token: Date.now().toString(36) + Math.random().toString(36).slice(2), 
        expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString() 
      };
      sessionStorage.setItem('pos_user', JSON.stringify(foundUser));
      sessionStorage.setItem('pos_session', JSON.stringify(session));
      setUser(foundUser);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }, [authenticateUser]);

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('pos_user');
    sessionStorage.removeItem('pos_session');
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