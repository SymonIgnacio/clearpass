import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

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
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token: Token must be a non-empty string');
      }

      // Store token first
      localStorage.setItem('authToken', token);

      // Attempt to decode the token
      const decoded = decodeJWT(token);

      if (decoded) {
        // Validate essential fields in the decoded token
        if (!decoded.id && !decoded.user_id) {
          console.warn('⚠️ AuthContext: Token missing user ID field');
          // Still allow login but log warning
        }

        setUser(decoded);
        setIsAuthenticated(true);
        console.log('✅ AuthContext: User logged in successfully');
        return decoded;
      } else {
        // Token couldn't be decoded, but we'll still store it
        // This allows the app to function and potentially re-validate later
        console.warn('⚠️ AuthContext: Token could not be decoded, but login proceeding');

        // Create a minimal user object from the token string
        // This is a fallback to prevent complete login failure
        const fallbackUser = {
          id: 'unknown',
          username: 'unknown',
          role: 'unknown',
          token_stored: true,
          decoded: false
        };

        setUser(fallbackUser);
        setIsAuthenticated(true);
        console.log('⚠️ AuthContext: Login completed with fallback user object');
        return fallbackUser;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);

      // Clean up on failure
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);

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
