import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { clearCsrfToken } from '../utils/csrf';
import { AuthContext } from './useAuth'

// Named export for the provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check for existing authentication via API call
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        console.log('🔐 AuthContext: Checking authentication status');
        const response = await api.get('/auth/me');
        if (response.ok && isMounted) {
          const userData = await response.json();
          console.log('🔐 AuthContext: User authenticated:', userData.user?.username);
          setUser(userData.user || userData);
          setIsAuthenticated(true);
        } else if (response.status === 401 && isMounted) {
          console.log('🔐 AuthContext: No valid authentication found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log('🔐 AuthContext: Authentication check failed:', error.message);
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
      console.log('🔐 AuthContext: Starting login process');
      
      const endpoint = options?.endpoint || '/auth/login'
      const response = await api.post(endpoint, credentials);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('🔐 AuthContext: Login successful, user data:', userData);
        
        setUser(userData.user || userData);
        setIsAuthenticated(true);
        return userData;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        console.error('🔐 AuthContext: Login failed with status:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
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
      console.error('Logout API call failed:', error);
    }
    
    clearCsrfToken();
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      const response = await api.get('auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('❌ AuthContext: checkAuth failed:', error);
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
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
