import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { clearCsrfToken } from '../utils/csrf';

export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.ok && isMounted) {
          const userData = await response.json();
          setUser(userData.user || userData);
          setIsAuthenticated(true);
        } else if (response.status === 401 && isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials, options = {}) => {
    try {
      const endpoint = options?.endpoint || '/auth/login';
      const response = await api.post(endpoint, credentials);

      if (response.ok) {
        const userData = await response.json();

        setUser(userData.user || userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const refreshUser = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user || userData);
        setIsAuthenticated(true);
        return userData;
      }
      if (response.status === 401) {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setRefreshing(false);
    }
    return null;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout API call failed - continue with local logout
    }

    clearCsrfToken();
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    login,
    logout,
    checkAuth,
    refreshUser,
    loading,
    refreshing,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
