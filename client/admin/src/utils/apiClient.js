// File: src/utils/apiClient.js
import router from '@/router';
// Import the global addNotification function directly
import { addNotification } from '@/composables/useNotifier';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create the final config object for the fetch call
  const config = {
    ...options,
    headers,
  };

  // --- THIS IS THE ROBUST FIX ---
  // This logic correctly handles all body types without breaking existing code.
  if (config.body) {
    // Case 1: The body is FormData (for file uploads).
    if (config.body instanceof FormData) {
      // Let the browser set the Content-Type with the correct boundary.
      delete config.headers['Content-Type'];
    } 
    // Case 2: The body is a plain JavaScript object that needs to be stringified.
    else if (typeof config.body === 'object' && config.body.constructor === Object) {
      config.body = JSON.stringify(config.body);
    }
    // Case 3: The body is already a string (pre-stringified JSON). Do nothing.
  }
  // --- END FIX ---

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // Attempt to parse the response body, even on errors
    const responseData = await response.json().catch(() => ({}));

    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      router.push({ name: 'login' });
      const error = new Error(responseData.msg || 'Session expired. Please log in again.');
      addNotification(error.message, 'failure');
      throw error;
    }

    // Handle all other server-side errors
    if (!response.ok) {
      const error = new Error(responseData.msg || 'An unknown server error occurred');
      addNotification(error.message, 'failure');
      throw error;
    }

    // On success, if it was a mutation (POST, PUT, DELETE) and the server sent a message, show it.
    if (responseData.msg && options.method && options.method !== 'GET') {
      addNotification(responseData.msg, 'success');
    }

    return responseData;

  } catch (error) {
    // This will catch network errors or errors re-thrown from above.
    console.error('API Client Error:', error);
    // Re-throw the error so any calling component can stop execution.
    throw error;
  }
};

export default apiClient;
