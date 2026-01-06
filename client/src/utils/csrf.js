// CSRF token management for secure requests

let csrfToken = null;

// Get CSRF token from server
export const getCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 
      import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.DEV ? 'http://localhost:3002/api' : '/api');
    
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken;
      return csrfToken;
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }
  
  return null;
};

// Clear CSRF token (call on logout)
export const clearCsrfToken = () => {
  csrfToken = null;
};

// Add CSRF token to request headers
export const addCsrfToken = async (headers = {}) => {
  const token = await getCsrfToken();
  if (token) {
    headers['X-CSRF-Token'] = token;
  }
  return headers;
};