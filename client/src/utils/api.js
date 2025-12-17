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
    console.log('🔐 [API Error] 401 Unauthorized - clearing all authentication data')

    // Determine user type BEFORE clearing localStorage
    const officerUser = localStorage.getItem('user')
    const officerToken = localStorage.getItem('authToken')
    const residentUser = localStorage.getItem('residentUser')
    const residentToken = localStorage.getItem('residentAuthToken')

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

    // Determine appropriate login page based on the stored user data
    let redirectPath = '/login'; // Default to resident login

    if (officerUser && officerToken) {
      try {
        const parsedUser = JSON.parse(officerUser)
        // Check if this was a staff user (admin, captain, secretary, clerk)
        const staffRoles = ['admin', 'captain', 'secretary', 'clerk']
        if (parsedUser.role && staffRoles.includes(parsedUser.role)) {
          redirectPath = '/officerlogin'
          console.log('🔐 [API Error] Redirecting staff user to officer login')
        } else {
          console.log('🔐 [API Error] Redirecting non-staff user to resident login')
        }
      } catch (parseError) {
        console.error('❌ [API Error] Failed to parse officer user data:', parseError)
      }
    } else if (residentUser && residentToken) {
      // Resident user - redirect to resident login
      redirectPath = '/login'
      console.log('🔐 [API Error] Redirecting resident user to resident login')
    }

    window.location.href = redirectPath
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
  // Determine user type before clearing data
  const officerUser = localStorage.getItem('user')
  let redirectPath = '/' // Default

  if (officerUser) {
    try {
      const parsedUser = JSON.parse(officerUser)
      const staffRoles = ['admin', 'captain', 'secretary', 'clerk']
      if (parsedUser.role && staffRoles.includes(parsedUser.role)) {
        redirectPath = '/officerlogin'
      } else {
        redirectPath = '/login'
      }
    } catch (error) {
      console.error('Error parsing user data during logout:', error)
      redirectPath = '/login'
    }
  } else {
    // Check for resident user
    const residentUser = localStorage.getItem('residentUser')
    redirectPath = residentUser ? '/login' : '/'
  }

  // Clear officer authentication
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  // Clear resident authentication
  localStorage.removeItem('residentAuthToken');
  localStorage.removeItem('residentUser');
  localStorage.removeItem('residentAuthTimestamp');

  // Clear any other auth-related data
  localStorage.removeItem('currentUser')
  localStorage.removeItem('userRole')

  window.location.href = redirectPath;
};
