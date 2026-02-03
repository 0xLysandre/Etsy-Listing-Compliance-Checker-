import { api, tokenManager } from './api';
import type { AuthResponse, User, ApiResponse, MessageResponse } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data.data!;

    // Store tokens and user in localStorage
    tokenManager.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, accessToken, refreshToken };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', credentials);
    const { user, accessToken, refreshToken, message } = response.data.data!;

    // Store tokens and user in localStorage
    tokenManager.setTokens(accessToken, refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, accessToken, refreshToken, message };
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    } finally {
      tokenManager.clearTokens();
    }
  },

  async verifyEmail(token: string): Promise<MessageResponse> {
    const response = await api.post<ApiResponse<MessageResponse>>('/auth/verify-email', { token });
    return response.data.data!;
  },

  async resendVerification(): Promise<MessageResponse> {
    const response = await api.post<ApiResponse<MessageResponse>>('/auth/resend-verification');
    return response.data.data!;
  },

  async forgotPassword(email: string): Promise<MessageResponse> {
    const response = await api.post<ApiResponse<MessageResponse>>('/auth/forgot-password', { email });
    return response.data.data!;
  },

  async resetPassword(data: ResetPasswordData): Promise<MessageResponse> {
    const response = await api.post<ApiResponse<MessageResponse>>('/auth/reset-password', data);
    return response.data.data!;
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return tokenManager.getAccessToken();
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },
};
