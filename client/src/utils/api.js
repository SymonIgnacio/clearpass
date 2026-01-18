// API utility functions with cookie-based authentication
import { addCsrfToken, clearCsrfToken } from './csrf.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3002/api' : '/api');

// Generic authenticated fetch function
export const apiRequest = async (endpoint, options = {}) => {
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  // Handle query parameters
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    // Remove params from options to avoid passing it to fetch
    delete options.params;
  }

  console.log('🔗 API Request:', url, options.method || 'GET');
  
  let headers = {
    ...options.headers
  };

  // Set default Content-Type to application/json only if not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Skip CSRF token for login/register endpoints to avoid circular dependency
  // But allow it for logout and other authenticated auth endpoints
  if (['POST', 'PUT', 'DELETE'].includes(options.method) && 
      !endpoint.includes('/auth/login') && 
      !endpoint.includes('/auth/register')) {
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

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  console.log('📊 API Response:', response.status, response.statusText);

  if (response.status === 401) {
    clearCsrfToken();
    // Don't redirect here - let the component handle it
    throw new Error('Authentication required');
  }

  return response;
};

// Convenience methods
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => apiRequest(endpoint, { method: 'POST', body: data, ...options }),
  put: (endpoint, data, options = {}) => apiRequest(endpoint, { method: 'PUT', body: data, ...options }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),
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
  return apiRequest('/residents/verification/upload', {
    method: 'POST',
    body: formData
  });
};
export const generateDocument = (id, data) => api.post(`documents/requests/${id}/generate`, data);
