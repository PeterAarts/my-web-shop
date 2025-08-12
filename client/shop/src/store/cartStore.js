// FILE: src/store/cartStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/utils/apiClient';
// REMOVED: No longer need to import authStore here to prevent race conditions

export const useCartStore = defineStore('cart', () => {
  // --- STATE and GETTERS (Unchanged) ---
  const items = ref([]);
  const guestToken = ref(localStorage.getItem('guestToken') || null);
  const loading = ref(false);
  const shippingAddress = ref(JSON.parse(localStorage.getItem('shippingAddress')) || {
    name: '', street: '', city: '', postalCode: '', countryCode: '', email: '', isSet: false 
  });
  const cartItemCount = computed(() => {
    const count = items.value.reduce((total, item) => total + item.quantity, 0);
    // DEBUG LOG: See if the item count is being recalculated
    console.log(`[Cart Store] Computed 'cartItemCount' is now: ${count}`);
    return count;
  });
  const cartTotalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  });
  // --- ACTIONS ---

  /**
   * This helper now reads directly from localStorage to avoid race conditions.
   * This is the key to the fix.
   */
  const _getCartHeaders = () => {
    const headers = {};
    const userToken = localStorage.getItem('token'); // Check for the shop user token

    // Only add the guest token if a user token does NOT exist.
    if (!userToken && guestToken.value) {
      headers['X-Guest-Token'] = guestToken.value;
    }
    // If a user token exists, we do nothing here. The apiClient will handle it.
    return headers;
  };

  const _updateStateFromApi = (apiCart) => {
  
    if (apiCart && apiCart.items) {
      items.value = apiCart.items.map(item => ({
        ...item.productId,
        quantity: item.quantity
      }));
    } else {
      items.value = [];
    }
  };

  const fetchCart = async () => {
    loading.value = true;
    try {
      const cartData = await apiClient('/cart', { headers: _getCartHeaders() });
      _updateStateFromApi(cartData);
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      items.value = [];
    } finally {
      loading.value = false;
    }
  };

  const init = async () => {
    const userToken = localStorage.getItem('token');
    if (guestToken.value || userToken) {
      await fetchCart();
    }
  };

  const addToCart = async (product, quantity) => {
    loading.value = true;
    try {
      const response = await apiClient('/cart/add', {
        method: 'POST',
        headers: _getCartHeaders(),
        body: { productId: product._id, quantity },
      });

      if (response.guestToken && !guestToken.value) {
        guestToken.value = response.guestToken;
        localStorage.setItem('guestToken', response.guestToken);
      }
      
      _updateStateFromApi(response.cart);
      
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const clearCart = async () => {
    const userToken = localStorage.getItem('token');
    if (userToken || guestToken.value) {
      try {
        await apiClient('/cart', { 
          method: 'DELETE',
          headers: _getCartHeaders()
        });
      } catch (error) {
        console.error("Failed to clear server-side cart:", error);
      }
    }
    items.value = [];
    guestToken.value = null;
    localStorage.removeItem('guestToken');
  };

  // Other actions remain the same
   const removeFromCart = async (productId) => {
    loading.value = true;
    try {
      const response = await apiClient(`/cart/remove/${productId}`, {
        method: 'DELETE',
      });
      _updateStateFromApi(response.cart);

    } catch (error) {
      console.error("Failed to remove item from cart:", error);
    } finally {
      loading.value = false;
    }
  };
  const updateQuantity = async (productId, quantity) => { /* ... */ };
  const setShippingAddress = (newAddress) => {
    shippingAddress.value = { ...shippingAddress.value, ...newAddress };
    localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress.value));
  };

  return {
    items, loading, shippingAddress, guestToken,
    cartItemCount, cartTotalPrice,
    init, fetchCart, addToCart, removeFromCart, updateQuantity, clearCart, setShippingAddress
  };
});