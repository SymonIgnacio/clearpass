// API response parsing utilities for safe handling of different response types

/**
 * Safely parse JSON from an API response, handling both Response objects and plain objects
 * @param {Response|object} response - API response object
 * @param {string} context - Context for error logging
 * @returns {Promise<object>} Parsed JSON data or fallback object
 */
export const safeJsonParse = async (response, context = 'API response') => {
  try {
    // Check if it's a Response object with .json method
    if (response && typeof response.json === 'function') {
      return await response.json().catch((err) => {
        console.error(`Failed to parse ${context} JSON:`, err);
        return {};
      });
    }

    // If it's already a plain object/array, return it
    if (response && typeof response === 'object') {
      return response;
    }

    // Fallback for unexpected response types
    console.warn(`${context}: Unexpected response type:`, typeof response, response);
    return {};
  } catch (error) {
    console.error(`Error parsing ${context}:`, error);
    return {};
  }
};

/**
 * Safely parse JSON from an API response with array fallback
 * @param {Response|object} response - API response object
 * @param {string} context - Context for error logging
 * @returns {Promise<array>} Parsed JSON data as array or empty array
 */
export const safeJsonParseArray = async (response, context = 'API response') => {
  const data = await safeJsonParse(response, context);
  return Array.isArray(data) ? data : [];
};

/**
 * Enhanced API request wrapper with consistent error handling
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {object} fallbacks - Fallback values for different scenarios
 * @returns {Promise<object>} Response data or fallback
 */
export const safeApiRequest = async (endpoint, options = {}, fallbacks = {}) => {
  const { onError = {}, onSuccess = {} } = fallbacks;

  try {
    const response = await apiRequest(endpoint, options).catch((err) => {
      console.error(`API request failed for ${endpoint}:`, err);
      return onError.response || {};
    });

    const data = await safeJsonParse(response, endpoint);

    if (response.ok === false) {
      console.error(`API request failed for ${endpoint}:`, response.status, data);
      return onError.data || {};
    }

    return data;
  } catch (error) {
    console.error(`Unexpected error in API request for ${endpoint}:`, error);
    return onError.data || {};
  }
};

// Import apiRequest for internal use
import { apiRequest } from './api';
