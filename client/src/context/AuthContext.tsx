import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type LoginCredentials, type RegisterCredentials } from '../services/auth.service';
import { tokenManager } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<string | undefined>;
  register: (credentials: RegisterCredentials) => Promise<string | undefined>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerification: () => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
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
      await authService.logout();
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
          await authService.logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<string | undefined> => {
    const { user: userData } = await authService.login(credentials);
    setUser(userData);
    return undefined;
  };

  const register = async (credentials: RegisterCredentials): Promise<string | undefined> => {
    const { user: userData, message } = await authService.register(credentials);
    setUser(userData);
    return message;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const verifyEmail = async (token: string): Promise<string> => {
    const { message } = await authService.verifyEmail(token);
    // Refresh user to get updated emailVerified status
    await refreshUser();
    return message;
  };

  const resendVerification = async (): Promise<string> => {
    const { message } = await authService.resendVerification();
    return message;
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const { message } = await authService.forgotPassword(email);
    return message;
  };

  const resetPassword = async (token: string, password: string): Promise<string> => {
    const { message } = await authService.resetPassword({ token, password });
    // Clear any stored tokens since user needs to log in again
    tokenManager.clearTokens();
    setUser(null);
    return message;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
