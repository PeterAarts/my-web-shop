// FILE: src/store/authStore.js
// DESC: Manages global authentication state, user profile, and all auth-related API interactions.

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter();

  // --- STATE ---
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const token = ref(localStorage.getItem('token') || null);
  const showLoginModal = ref(false);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role);

  // --- PRIVATE ACTIONS ---

  const authenticatedFetch = async (endpoint, options = {}) => {
    const res = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`,
        ...options.headers,
      },
    });
    if (res.status === 204) {
        return null;
    }
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        logout();
      }
      throw new Error(data.msg || 'An error occurred.');
    }
    return data;
  };

  const setAuthData = (authData) => {
    user.value = authData.user;
    token.value = authData.token;
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('token', authData.token);
  };

  const clearAuthData = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // --- PUBLIC ACTIONS ---

  /**
   * Fetches the current user's data from the server to validate the token and refresh state.
   */
  const fetchUser = async () => {
    try {
      const userData = await authenticatedFetch('/users/me');
      user.value = userData;
      localStorage.setItem('user', JSON.stringify(user.value));
    } catch (error) {
      console.error("Token validation failed, user was logged out.", error.message);
    }
  };

  /**
   * Initializes the store. If a token exists, it's validated by fetching the user profile.
   */
  const init = async () => {
    if (token.value) {
      await fetchUser();
    }
  };

  const openLoginModal = () => {
    showLoginModal.value = true;
  };

  const closeLoginModal = () => {
    showLoginModal.value = false;
  };

  const login = async (credentials) => {
    const response = await fetch(`${apiUrl}/auth/shop-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Login failed.');
    }
    setAuthData(data);
  };

  const logout = () => {
    clearAuthData();
    router.push('/'); 
  };

  const register = async (userData) => {
    const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.msg || 'Registration failed.');
    }
    return data;
  };

  const forgotPassword = async (email) => {
    const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await response.json();
     if (!response.ok) {
        throw new Error(data.msg || 'Request failed.');
    }
    return data;
  };

  const resetPassword = async (token, password) => {
    const response = await fetch(`${apiUrl}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const data = await response.json();
     if (!response.ok) {
        throw new Error(data.msg || 'Password reset failed.');
    }
    return data;
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await authenticatedFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    });
    user.value = { ...user.value, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(user.value));
  };

  const changePassword = async (passwordData) => {
    return await authenticatedFetch('/users/me/password', {
        method: 'PUT',
        body: JSON.stringify(passwordData)
    });
  };

  const deleteAccount = async () => {
    await authenticatedFetch('/users/me', {
        method: 'DELETE'
    });
    logout();
  };

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    init,
    fetchUser,
  };
});