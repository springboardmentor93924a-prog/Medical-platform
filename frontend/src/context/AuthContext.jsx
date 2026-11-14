import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medistock_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('medistock_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('medistock_token');
      if (storedToken) {
        try {
          const res = await userService.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('medistock_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password, selectedRole = null) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      const { accessToken, refreshToken, user: userData } = res.data;

      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('medistock_token', accessToken);
      localStorage.setItem('medistock_refresh_token', refreshToken);
      localStorage.setItem('medistock_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await authService.register(formData);
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('medistock_refresh_token');
    localStorage.removeItem('medistock_user');
  };

  const updateUserProfile = (newProfileData) => {
    setUser(newProfileData);
    localStorage.setItem('medistock_user', JSON.stringify(newProfileData));
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    supplierId: user?.supplierId || null,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
