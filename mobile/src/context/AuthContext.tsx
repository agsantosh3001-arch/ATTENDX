import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api, setStoredToken, getStoredToken } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginAdmin: (data: any) => Promise<void>;
  onboardUser: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        setStoredToken(urlToken);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
      }
    } catch (err) {
      setUser(null);
      setStoredToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleLogoutEvent = () => {
      setUser(null);
      setStoredToken(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const loginAdmin = async (data: any) => {
    const res = await api.post('/auth/admin/login', data);
    if (res.data?.success) {
      const { accessToken, user } = res.data.data;
      setStoredToken(accessToken);
      setUser(user);
    }
  };

  const onboardUser = async (data: any) => {
    const res = await api.post('/auth/onboard', data);
    if (res.data?.success) {
      setUser(res.data.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setStoredToken(null);
    }
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginAdmin,
        onboardUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
