import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  company_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        // Verify token is still valid by fetching current user
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Token validation failed:', error);
        logout();
      }
    }
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiService.login(email, password);
      setUser(data.user);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      const data = await apiService.register(email, password, fullName);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Cadastro realizado com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao fazer cadastro';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Você saiu da sua conta');
  };

  const resetPassword = async (email: string) => {
    try {
      await apiService.resetPassword(email);
      toast.success('Email de recuperação enviado!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao enviar email';
      toast.error(message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
