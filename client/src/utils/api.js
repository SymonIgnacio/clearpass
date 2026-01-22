// API utility functions with cookie-based authentication
import { addCsrfToken, clearCsrfToken } from './csrf.js';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
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

  let headers = {
    ...options.headers,
  };

  // Set default Content-Type to application/json only if not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Skip CSRF token for login/register endpoints to avoid circular dependency
  // But allow it for logout and other authenticated auth endpoints
  if (
    ['POST', 'PUT', 'DELETE'].includes(options.method) &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/register')
  ) {
    try {
      headers = await addCsrfToken(headers);
    } catch (csrfError) {
      // For certificates, this is critical
      if (endpoint.includes('certificates')) {
        // Failed to obtain CSRF token
      }
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

  let response = await fetch(url, config);

  // Handle CSRF Token Mismatch (403 Forbidden with specific code)
  if (response.status === 403) {
    try {
      // Clone response to read body without consuming original stream for the caller
      const clonedRes = response.clone();
      const errorData = await clonedRes.json();

      if (
        errorData.code === 'EBADCSRFTOKEN' ||
        (errorData.message && errorData.message.toLowerCase().includes('csrf'))
      ) {
        // Clear cached token
        clearCsrfToken();

        // Refresh headers with new token
        // addCsrfToken calls getCsrfToken which will fetch a new one since cache is cleared
        headers = await addCsrfToken({ ...options.headers });
        config.headers = headers;

        // Increased delay to ensure cookie persistence (100ms was too short causing race conditions)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Retry request once
        response = await fetch(url, config);
      }
    } catch (e) {
      // If parsing fails or retry fails, we just return the original 403 response
      // so the application can handle the error normally
    }
  }

  // For 401 responses, clear CSRF token and return response
  // Don't throw error - let AuthContext handle it gracefully
  if (response.status === 401) {
    clearCsrfToken();
  }

  return response;
};

// Convenience methods
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) =>
    apiRequest(endpoint, { method: 'POST', body: data, ...options }),
  put: (endpoint, data, options = {}) =>
    apiRequest(endpoint, { method: 'PUT', body: data, ...options }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),
};

// Check if user is authenticated via cookies
export const isAuthenticated = () => {
  return document.cookie.includes('authToken');
};

// Get current user - use AuthContext instead
export const getCurrentUser = () => {
  return null;
};

// Logout function - clears cookie-based authentication
export const logout = async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    // Logout API call failed - continue with local logout
  }

  clearCsrfToken();
  // Clear only session-specific data, not all localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('userPreferences');
  window.location.href = '/login';
};

// Specific API endpoint functions
export const getResidentProfile = () => api.get('resident-auth/profile');
export const updateResidentProfile = data => api.put('resident-auth/profile', data);
export const uploadVerification = formData => {
  return apiRequest('/resident-auth/upload-verification', {
    method: 'POST',
    body: formData,
  });
};
export const generateDocument = (id, data) => api.post(`documents/requests/${id}/generate`, data);
