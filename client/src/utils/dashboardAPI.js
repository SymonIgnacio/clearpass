import api from './api';

// Role-specific dashboard endpoints
const DASHBOARD_ENDPOINTS = {
  2: '/api/captain/dashboard',     // Captain
  3: '/api/secretary/dashboard',   // Secretary  
  4: '/api/clerk/dashboard',       // Clerk
  5: '/api/admin/stats',           // Admin (uses stats endpoint)
  6: '/api/officer/dashboard',     // Blotter Officer
  12: '/api/resident/dashboard'    // Resident
};

// Role-specific data fetchers
export const dashboardAPI = {
  // Get role-specific dashboard data
  getDashboard: async (userRole) => {
    const endpoint = DASHBOARD_ENDPOINTS[userRole] || '/api/admin/stats';
    const response = await api.get(endpoint);
    return response.data;
  },

  // Get residents data (role-specific access)
  getResidents: async (userRole, params = {}) => {
    const endpoints = {
      2: '/api/captain/residents',
      3: '/api/secretary/residents', 
      4: '/api/clerk/residents',
      5: '/api/residents',
      6: '/api/residents'
    };
    const endpoint = endpoints[userRole] || '/api/residents';
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // Get blotter data (role-specific access)
  getBlotter: async (userRole, params = {}) => {
    const endpoints = {
      2: '/api/captain/blotters',
      3: '/api/secretary/blotters',
      6: '/api/officer/cases',
      5: '/api/blotter',
      4: '/api/blotter'
    };
    const endpoint = endpoints[userRole] || '/api/blotter';
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // Get documents/certificates (role-specific access)
  getDocuments: async (userRole, params = {}) => {
    const endpoints = {
      2: '/api/captain/clearances',
      3: '/api/secretary/clearances',
      4: '/api/clerk/clearances',
      5: '/api/certificates',
      6: '/api/certificates'
    };
    const endpoint = endpoints[userRole] || '/api/certificates';
    const response = await api.get(endpoint, { params });
    return response.data;
  },

  // Get programs/events
  getPrograms: async () => {
    const response = await api.get('/api/programs');
    return response.data;
  },

  // Get census data
  getCensus: async () => {
    const response = await api.get('/api/census');
    return response.data;
  },

  // Get AI analytics (role-specific)
  getAIAnalytics: async (userRole) => {
    const endpoints = {
      5: '/api/admin/ai-analytics',
      6: '/api/officer/ai-analytics'
    };
    const endpoint = endpoints[userRole] || '/api/ai/analytics';
    const response = await api.get(endpoint);
    return response.data;
  }
};

export default dashboardAPI;