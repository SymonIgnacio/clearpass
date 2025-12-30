// API utility functions with authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage - unified JWT authentication
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  console.log('🔑 [Token Check] authToken exists:', !!token);
  return token;
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
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
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
    console.log('🔐 [API Error] 401 Unauthorized - clearing authentication data')

    // Clear authentication data
    localStorage.removeItem('authToken')

    // Clear any legacy auth-related data
    localStorage.removeItem('user')
    localStorage.removeItem('residentAuthToken')
    localStorage.removeItem('residentUser')
    localStorage.removeItem('residentAuthTimestamp')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userRole')

    // Redirect to login
    window.location.href = '/login'
    throw new Error('Authentication required')
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

// Get current user from localStorage - unified authentication
export const getCurrentUser = () => {
  // Since we now use AuthContext, this function may be deprecated
  // But keeping for backward compatibility with any non-React code
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Decode JWT to get user info
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
  }
  return null;
};

// Logout function - clears unified authentication data
export const logout = () => {
  // Clear authentication data
  localStorage.removeItem('authToken');

  // Clear any legacy auth-related data
  localStorage.removeItem('user');
  localStorage.removeItem('residentAuthToken');
  localStorage.removeItem('residentUser');
  localStorage.removeItem('residentAuthTimestamp');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('userRole');

  // Redirect to login
  window.location.href = '/login';
};

// Specific API endpoint functions with corrected paths
export const getResidentProfile = () => api.get('residents/me');
export const updateResidentProfile = (data) => api.put('residents/me', data);
export const uploadVerification = (formData) => {
  // For file uploads, we need to use fetch directly with FormData
  // Don't set Content-Type as FormData sets its own boundary
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}residents/verification/upload`;
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: formData
  });
};
export const generateDocument = (id, data) => api.post(`documents/requests/${id}/generate`, data);
