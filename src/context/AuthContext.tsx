import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  requestOtp: (email: string) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string, otp: string) => Promise<string>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          apiService.clearToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
  try {
    const result = await apiService.forgotPassword(email);
    return result.message || 'Reset link sent successfully.';
  } catch (error: any) {
    console.error('Forgot password error:', error);
    throw new Error(error.message || 'Failed to send reset link.');
  }
};

const requestOtp = async (email: string): Promise<string> => {
  const result = await apiService.requestOtp(email);
  return result.message;
};

const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const result = await apiService.verifyOtp(email, otp);
  return result.success;
};

const resetPassword = async (email: string, newPassword: string, otp: string): Promise<string> => {
  const result = await apiService.resetPassword(email, newPassword, otp);
  return result.message;
};

  const logout = () => {
    setUser(null);
    apiService.clearToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, forgotPassword,requestOtp,verifyOtp,resetPassword,isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
