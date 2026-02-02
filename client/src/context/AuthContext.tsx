import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type LoginCredentials, type RegisterCredentials } from '../services/auth.service';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getProfile();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      authService.logout();
      setUser(null);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getStoredToken();
      if (token) {
        try {
          await refreshUser();
        } catch {
          authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    const { user: userData } = await authService.login(credentials);
    setUser(userData);
  };

  const register = async (credentials: RegisterCredentials) => {
    const { user: userData } = await authService.register(credentials);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
