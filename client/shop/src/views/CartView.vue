<!-- FILE: src/views/CartView.vue -->
<template>
  <div class="container ">
    <h4 class="mb-4">Your Shopping Cart</h4>
    <div v-if="cartStore.items.length === 0" class="text-center text-muted py-5 bg-light rounded">
      <h2>Your cart is empty.</h2>
      <p>Start shopping to add items to your cart.</p>
      <RouterLink to="/shop" class="btn btn-primary mt-3">Go to Shop</RouterLink>
    </div>

    <div v-else class="row g-4">
      <!-- Cart Items List -->
      <div class="col-lg-8">
        <div class="card shadow-sm">
          <div class="list-group list-group-flush">
            <div v-for="item in cartStore.items" :key="item._id" class="list-group-item p-1">
              <div class="row align-items-center">
                <div class="col-2">
                  <img :src="getImageUrl(item.images?.[0]?.path)" class="img-fluid rounded" alt="">
                </div>
                <div class="col">
                  <div class="d-flex">
                    <div class="col">
                      <h6 class="mb-0">{{ item.name }}</h6>
                      </br>
                      <span class="me-3 small">
                            <i class="ph ph-ruler text-primary me-1"></i>
                            {{ item.dimensions.length }} x {{ item.dimensions.width }} x {{ item.dimensions.height }} cm
                        </span>
                        <span class="small"> 
                            <i class="ph ph-scales mx-1 text-primary"></i>
                            {{ item.weight }}g
                        </span>
                      
                    </div>
                    <div class="col-4 ms-auto text-end me-2">
                      <span class="text-muted small ">( {{ item.quantity }} x </span> <span class="text-muted me-5 small">€ {{ item.price.toFixed(2) }} )</span>
                      <span class="fw-bold ">€ {{ (item.price * item.quantity).toFixed(2) }}</span>
                    </div>
                    <div class="ms-auto text-end me-2">
                      <button @click="cartStore.removeFromCart(item._id)" class="btn btn-sm btn-outline-danger border-0"><i class="ph ph-trash"></i></button>
                    </div>
                  </div>  
                </div>
              </div>
            </div>
          </div>
          <!-- ADDED: Remove All Button -->
          <div class="card-footer text-end bg-light p-3">
            <button @click="confirmClearCart" class="btn btn-outline-primary">
              <i class="ph ph-trash-simple me-2"></i>
              Remove All Items
            </button>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="col-lg-4">
        <div class="card shadow-sm sticky-top ticket">
          <div class="card-body">
            <h4 class="card-title mb-4">Order Summary</h4>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Subtotal</span>
                <strong>€{{ cartStore.cartTotalPrice.toFixed(2) }}</strong>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Shipping</span>
                <span class="text-muted">Calculated at next step</span>
              </li>
            </ul>
            <hr>
            <div class="d-flex justify-content-between fw-bold fs-5 px-0">
              <span>Total</span>
              <span>€{{ cartStore.cartTotalPrice.toFixed(2) }}</span>
            </div>
            <div class="d-grid mt-4">
              <RouterLink to="/checkout" class="btn btn-primary btn-lg">
                Proceed to Checkout
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/store/cartStore.js';
import { RouterLink } from 'vue-router';

const cartStore = useCartStore();

const getImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return 'https://placehold.co/100x100/EEE/31343C?text=...';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) {
    return trimmedPath;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
};


const confirmClearCart = () => {
  // In a real application, you would use a custom modal here instead of the browser's confirm dialog.
  if (confirm('Are you sure you want to remove all items from your cart?')) {
    cartStore.clearCart();
  }
};
</script>

<style scoped>
.btn-link.text-danger {
  text-decoration: none;
}
.btn-link.text-danger:hover {
  text-decoration: underline;
}
</style>
