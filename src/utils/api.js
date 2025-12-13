// API utility functions with authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Create authenticated headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Generic authenticated fetch function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/${endpoint}`;
  console.log('🔗 API Request URL:', url); // Debug log
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };

  // If body is an object, stringify it
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  // Handle unauthorized responses
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
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

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Logout function
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/';
};
