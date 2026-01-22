import { api } from './api';

// Role-specific dashboard endpoints
const DASHBOARD_ENDPOINTS = {
  1: '/admin/stats', // Admin (uses stats endpoint)
  2: '/clerk/dashboard', // Clerk
  3: '/officer/dashboard', // Blotter Officer
  4: '/resident/dashboard', // Resident
  5: '/captain/dashboard', // Captain
  6: '/secretary/dashboard', // Secretary
  default: '/dashboard', // Generic fallback
};

// Role-specific data fetchers
export const dashboardAPI = {
  // Get role-specific dashboard data
  getDashboard: async userRole => {
    const endpoint = DASHBOARD_ENDPOINTS[userRole] || DASHBOARD_ENDPOINTS['default'];
    const response = await api.get(endpoint);
    const data = await response.json();
    return data;
  },

  // Get residents data (role-specific access)
  getResidents: async (userRole, params = {}) => {
    const endpoints = {
      2: '/captain/residents',
      3: '/secretary/residents',
      4: '/clerk/residents',
      5: '/residents',
      6: '/residents',
    };
    const endpoint = endpoints[userRole] || '/residents';
    const response = await api.get(endpoint, { params });
    const data = await response.json();
    return data;
  },

  // Get blotter data (role-specific access)
  getBlotter: async (userRole, params = {}) => {
    const endpoints = {
      2: '/captain/blotters',
      3: '/secretary/blotters',
      6: '/officer/cases',
      5: '/blotter',
      4: '/blotter',
    };
    const endpoint = endpoints[userRole] || '/blotter';
    const response = await api.get(endpoint, { params });
    const data = await response.json();
    return data;
  },

  // Get documents/certificates (role-specific access)
  getDocuments: async (userRole, params = {}) => {
    const endpoints = {
      2: '/captain/clearances',
      3: '/secretary/clearances',
      4: '/clerk/clearances',
      5: '/certificates',
      6: '/certificates',
    };
    const endpoint = endpoints[userRole] || '/certificates';
    const response = await api.get(endpoint, { params });
    const data = await response.json();
    return data;
  },

  // Get programs/events
  getPrograms: async () => {
    const response = await api.get('programs');
    const data = await response.json();
    return data;
  },

  // Get census data
  getCensus: async () => {
    const response = await api.get('/census');
    const data = await response.json();
    return data;
  },

  // Get AI analytics (role-specific)
  getAIAnalytics: async userRole => {
    const endpoints = {
      5: '/admin/ai-analytics',
      6: '/officer/ai-analytics',
    };
    const endpoint = endpoints[userRole] || '/ai/analytics';
    const response = await api.get(endpoint);
    const data = await response.json();
    return data;
  },
};

export default dashboardAPI;
