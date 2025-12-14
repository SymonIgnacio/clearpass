// API utility functions with authentication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage - supports both officer and resident authentication
const getAuthToken = () => {
  // Check for officer authentication (JWT-based)
  const officerToken = localStorage.getItem('authToken');
  const officerUser = localStorage.getItem('user');

  // Check for resident authentication (Firebase-based)
  const residentToken = localStorage.getItem('residentAuthToken');
  const residentUser = localStorage.getItem('residentUser');

  console.log('🔑 [Token Check] officerToken exists:', !!officerToken);
  console.log('🔑 [Token Check] residentToken exists:', !!residentToken);
  console.log('🔑 [Token Check] officerUser exists:', !!officerUser);
  console.log('🔑 [Token Check] residentUser exists:', !!residentUser);

  // Prioritize by user type - check if we have complete sets
  // If both officer and resident data exist, prioritize officer (legacy behavior)
  if (officerToken && officerUser) {
    console.log('🔑 [Token Check] Using officer token (complete set)');
    return officerToken;
  } else if (residentToken && residentUser) {
    console.log('🔑 [Token Check] Using resident token (complete set)');
    return residentToken;
  }

  // Fallback to any available token
  if (officerToken) {
    console.log('🔑 [Token Check] Using officer token (fallback)');
    return officerToken;
  } else if (residentToken) {
    console.log('🔑 [Token Check] Using resident token (fallback)');
    return residentToken;
  }

  // No authentication found
  console.log('🔑 [Token Check] No tokens found');
  return null;
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
    console.log('🔐 [API Error] 401 Unauthorized - clearing all authentication data')

    // Clear officer authentication data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')

    // Clear resident authentication data
    localStorage.removeItem('residentAuthToken')
    localStorage.removeItem('residentUser')
    localStorage.removeItem('residentAuthTimestamp')

    // Clear any other auth-related data
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userRole')

    // Determine appropriate login page based on available data or redirect to generic login
    const officerUser = localStorage.getItem('user')
    const residentUser = localStorage.getItem('residentUser')

    if (!officerUser && !residentUser) {
      // No auth data found, go to resident login (most common)
      window.location.href = '/login'
    } else {
      window.location.href = '/'
    }

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

// Get current user from localStorage - supports both officer and resident users
export const getCurrentUser = () => {
  // Check for officer user first
  const officerUser = localStorage.getItem('user');
  if (officerUser) {
    return JSON.parse(officerUser);
  }

  // Check for resident user
  const residentUser = localStorage.getItem('residentUser');
  if (residentUser) {
    return JSON.parse(residentUser);
  }

  return null;
};

// Logout function - clears all authentication data for both user types
export const logout = () => {
  // Clear officer authentication
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  // Clear resident authentication
  localStorage.removeItem('residentAuthToken');
  localStorage.removeItem('residentUser');

  window.location.href = '/';
};
