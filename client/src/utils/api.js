// API utility functions with cookie-based authentication
import { addCsrfToken, clearCsrfToken } from './csrf';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3002/api' : '/api');

// Generic authenticated fetch function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  let headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Skip CSRF token for auth endpoints to avoid circular dependency
  if (['POST', 'PUT', 'DELETE'].includes(options.method) && !endpoint.includes('/auth/')) {
    try {
      headers = await addCsrfToken(headers);
    } catch (csrfError) {
      console.warn('CSRF token fetch failed:', csrfError);
      // Continue without CSRF token for auth operations
    }
  }
  
  const config = {
    credentials: 'include',
    headers,
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    clearCsrfToken();
    // Don't redirect here - let the component handle it
    throw new Error('Authentication required');
  }

  return response;
};

// Convenience methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: data }),
  put: (endpoint, data) => apiRequest(endpoint, { method: 'PUT', body: data }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

// Check if user is authenticated via cookies
export const isAuthenticated = () => {
  return document.cookie.includes('authToken');
};

// Get current user - use AuthContext instead
export const getCurrentUser = () => {
  console.warn('getCurrentUser is deprecated, use AuthContext instead');
  return null;
};

// Logout function - clears cookie-based authentication
export const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  clearCsrfToken();
  localStorage.clear();
  window.location.href = '/login';
};

// Specific API endpoint functions
export const getResidentProfile = () => api.get('residents/me');
export const updateResidentProfile = (data) => api.put('residents/me', data);
export const uploadVerification = (formData) => {
  const url = `${API_BASE_URL}/residents/verification/upload`;
  return fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
};
export const generateDocument = (id, data) => api.post(`documents/requests/${id}/generate`, data);