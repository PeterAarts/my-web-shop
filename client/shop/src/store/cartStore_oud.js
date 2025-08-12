// FILE: src/store/cartStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/utils/apiClient'; // We'll need the API client

// We define our store using 'cart' as a unique ID.
export const useCartStore = defineStore('cart', () => {
  // --- STATE ---
  // Items are now fetched from the server, so we start with an empty array.
  const items = ref([]);
  // NEW: State for the guest session token, initialized from localStorage.
  const guestToken = ref(localStorage.getItem('guestToken') || null);
  // NEW: Loading state for UI feedback.
  const loading = ref(false);

  // Shipping Address state can remain as is, managed on the client until checkout.
  const shippingAddress = ref(JSON.parse(localStorage.getItem('shippingAddress')) || {
    name: '', street: '', city: '', postalCode: '', countryCode: '', isSet: false 
  });

  // --- ACTIONS ---

  const setShippingAddress = (newAddress) => {
    shippingAddress.value = { ...shippingAddress.value, ...newAddress };
    localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress.value));
  };
  
  // NEW: Action to fetch the entire cart from the backend.
  const fetchCart = async () => {
    loading.value = true;
    try {
      const cartData = await apiClient('/cart'); // API client will send the correct token (user or guest)
      // The backend populates product details, so we map them correctly.
      if (cartData && cartData.items) {
        items.value = cartData.items.map(item => ({
          ...item.productId, // Full product data
          quantity: item.quantity
        }));
      } else {
        items.value = [];
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      items.value = []; // Clear cart on error to be safe
    } finally {
      loading.value = false;
    }
  };

  // REFACTORED: addToCart now calls the backend API.
  const addToCart = async (product, quantity) => {
    loading.value = true;
    try {
      const response = await apiClient('/cart/add', {
        method: 'POST',
        body: { productId: product._id, quantity },
      });

      // If the backend generated a new guest token (for a first-time guest), save it.
      if (response.guestToken) {
        guestToken.value = response.guestToken;
        localStorage.setItem('guestToken', response.guestToken);
      }
      
      // Update the local state with the definitive cart returned from the server.
      items.value = response.cart.items.map(item => ({
        ...item.productId,
        quantity: item.quantity
      }));
      
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      // You could add a user notification here.
    } finally {
      loading.value = false;
    }
  };

  // You would create similar async actions for removeFromCart and updateQuantity
  // that call new backend endpoints and update the state with the response.
  const removeFromCart = async (productId) => {
    // Example: await apiClient(`/cart/remove/${productId}`, { method: 'DELETE' });
    // await fetchCart(); // Re-fetch the cart to ensure consistency
  };

  const updateQuantity = async (productId, quantity) => {
     // Example: await apiClient('/cart/update', { method: 'PUT', body: { productId, quantity } });
     // await fetchCart();
  };

  // REFACTORED: clearCart should also clear the guest token.
  const clearCart = () => {
    items.value = [];
    guestToken.value = null;
    localStorage.removeItem('guestToken');
    // You would also call a backend endpoint to clear the cart in the database.
    // Example: await apiClient('/cart/clear', { method: 'POST' });
  };


  // --- GETTERS ---
  // These computed properties will work exactly as before, no changes needed.
  const cartItemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0);
  });

  const cartTotalPrice = computed(() => {
    return items.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  });

  // Expose state, actions, and getters to the components.
  return {
    items,
    shippingAddress,
    guestToken,
    loading,
    fetchCart, // Expose the new action
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setShippingAddress,
    cartItemCount,
    cartTotalPrice,
  };
});