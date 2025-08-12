// FILE: src/utils/apiClient.js

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore'; // NEW: Import the cart store

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * A centralized utility for making API requests to your webshop's backend.
 * It automatically adds the JWT token for authenticated users OR a guest token.
 * @param {string} endpoint - The API endpoint to call (e.g., '/products').
 * @param {object} options - The standard options for a fetch call (method, body, etc.).
 * @returns {Promise<any>} The JSON response from the API.
 */
export default async function apiClient(endpoint, options = {}) {
  // Get store instances to access tokens
  const authStore = useAuthStore();
  const cartStore = useCartStore(); // NEW: Get cart store instance
  
  const token = authStore.token;
  const guestToken = cartStore.guestToken; // NEW: Get the guest token from the cart store

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add the Authorization header for logged-in users
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (guestToken) {
    // NEW: If no user is logged in, but we have a guest token, send it instead.
    headers['X-Guest-Token'] = guestToken;
  }

  const config = {
    ...options,
    headers,
  };
    // If the body is an object, convert it to a JSON string.
  // We also check to make sure it's not FormData, which is used for file uploads.
  if (config.body && typeof config.body === 'object') {
    if (!(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
    } else {
        // If it's FormData, the browser sets the Content-Type header automatically.
        // So we must delete our manual 'Content-Type' header.
        delete headers['Content-Type'];
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (response.status === 204) {
      return null;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      authStore.logout();
    }
    throw new Error(data.msg || 'An API error occurred.');
  }

  return data;
}