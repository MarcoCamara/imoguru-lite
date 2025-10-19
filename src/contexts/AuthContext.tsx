import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string;
  company_id?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean; // Alias for isLoading
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  signOut: () => void; // Alias for logout
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string, token?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      try {
        // Always fetch current user from server to validate token and get roles
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
        // Check if user has admin role (roles is an array)
        setIsAdmin(Boolean(currentUser.roles?.includes('admin')));
        localStorage.setItem('user', JSON.stringify(currentUser));
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
      // Fetch complete user data with roles
      await refreshUser();
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
    setIsAdmin(false);
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
      // Check if user has admin role (roles is an array)
      setIsAdmin(Boolean(currentUser.roles?.includes('admin')));
      localStorage.setItem('user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const updatePassword = async (newPassword: string, token?: string) => {
    try {
      // If token is provided, use it (for reset password flow)
      // Otherwise, user is logged in and changing password
      if (token) {
        await apiService.updatePassword(token, newPassword);
      } else {
        // For logged-in users, we'd need a different endpoint
        // For now, just show error if no token
        throw new Error('Token de redefinição não encontrado');
      }
      toast.success('Senha atualizada com sucesso!');
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Erro ao atualizar senha';
      toast.error(message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading, // Alias
        isAdmin,
        login,
        register,
        logout,
        signOut: logout, // Alias
        resetPassword,
        updatePassword,
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
