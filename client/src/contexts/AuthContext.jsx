import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

// Helper function to decode JWT payload
const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('Failed to decode JWT:', error);
    return null;
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp && decoded.exp > currentTime) {
            setUser(decoded);
            setIsAuthenticated(true);
            console.log('✅ AuthContext: User restored from localStorage');
          } else {
            console.log('❌ AuthContext: Token expired, clearing');
            localStorage.removeItem('authToken');
          }
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Update isAuthenticated when user changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const login = (token) => {
    try {
      localStorage.setItem('authToken', token);
      const decoded = decodeJWT(token);
      if (decoded) {
        setUser(decoded);
        console.log('✅ AuthContext: User logged in');
      } else {
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    console.log('✅ AuthContext: User logged out');
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
    loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
