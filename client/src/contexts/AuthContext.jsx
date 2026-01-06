import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { clearCsrfToken } from '../utils/csrf';

// Helper function to decode JWT payload
const decodeJWT = (token) => {
  if (!token || typeof token !== 'string') {
    console.warn('decodeJWT: Invalid token - not a string or empty');
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    console.warn('decodeJWT: Invalid JWT format - expected 3 parts, got', parts.length);
    return null;
  }

  try {
    const base64Url = parts[1];

    // Handle URL-safe base64 decoding
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if needed
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    // Use modern atob if available, fallback to manual decoding
    let decoded;
    try {
      decoded = atob(paddedBase64);
    } catch (atobError) {
      console.warn('decodeJWT: atob failed, trying manual decoding');
      // Manual base64 decoding for environments where atob is not available
      decoded = Buffer.from(paddedBase64, 'base64').toString();
    }

    const jsonPayload = decodeURIComponent(
      decoded.split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );

    const payload = JSON.parse(jsonPayload);

    // Validate essential payload structure
    if (!payload || typeof payload !== 'object') {
      console.warn('decodeJWT: Invalid payload structure');
      return null;
    }

    console.log('decodeJWT: Successfully decoded JWT payload');
    return payload;
  } catch (error) {
    console.error('decodeJWT: Failed to decode JWT:', error.message);
    return null;
  }
};

const AuthContext = createContext();

// Named export for the hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Named export for the provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const login = async (credentials) => {
    try {
      console.log('🔐 AuthContext: Starting login process');
      
      const response = await api.post('/auth/login', credentials);
      
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
    loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
