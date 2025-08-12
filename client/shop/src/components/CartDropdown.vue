<!-- FILE: src/components/CartDropdown.vue (NEW FILE) -->
<!-- This component shows the cart icon and a summary on hover. -->
<template>
  <div class="dropdown">
    <!-- This RouterLink now includes the item count badge -->
    <RouterLink to="/cart" class="nav-link dropdown-toggle" type="button" id="cartDropdownButton"  data-bs-toggle="dropdown" aria-label="Shopping Basket">
      <i class="ph-fill ph-shopping-cart-simple fs-5"></i>
      <span v-if="cartStore.cartItemCount > 0" class="badge bg-secondary rounded-pill position-absolute top-10 start-100 translate-middle" style="font-size: 0.6em; padding: .35em .5em;">
        {{ cartStore.cartItemCount }}
      </span>
    </RouterLink>

    <!-- This is the dropdown menu that appears on hover -->
    <div class="dropdown-menu dropdown-menu-end" aria-labelledby="Shopping Basket" style="width: 350px;">
      <div v-if="cartStore.items.length === 0" class="text-center text-muted">
        Your cart is empty.
      </div>
      <div v-else>
        <div class="card  border-0 p-3">
          <ul class="list-unstyled mb-0">
            <li v-for="item in cartStore.items" :key="item._id" class="d-flex align-items-center mb-3">
              <img :src="getImageUrl(item.images?.[0]?.path)" class="img-fluid rounded me-3" style="width: 50px; height: 50px; object-fit: cover;" alt="">
              <div class="flex-grow-1">
                <h6 class="mb-0 small">{{ item.name }}</h6>
                <small class="text-muted">{{ item.quantity }} x €{{ item.price.toFixed(2) }}</small>
              </div>
              <span class="fw-bold small">€{{ (item.quantity * item.price).toFixed(2) }}</span>
            </li>
          </ul>
          <hr>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold">Subtotal:</span>
            <span class="fw-bold fs-5">€{{ cartStore.cartTotalPrice.toFixed(2) }}</span>
          </div>
          <div class="d-grid gap-2">
            <RouterLink to="/cart" class="btn btn-secondary">View Cart</RouterLink>
            <RouterLink to="/checkout" class="btn btn-primary">Proceed to Checkout</RouterLink>
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
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
}
</script>

<style scoped>
/* This CSS enables the hover effect for the dropdown on desktop */
@media (min-width: 992px) {
  .dropdown:hover .dropdown-menu {
    display: block;
    margin-top: 0; 
    z-index: 1030;
  }
}
.dropdown-menu {
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,.15);
}
.nav-link {
  position: relative;
}
</style>