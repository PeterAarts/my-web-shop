<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-md-5 ">
        
        <div v-if="loading">
          <div class="card shadow-sm">
            <div class="card-body p-5">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="lead">Finalizing your order, please wait...</p>
            </div>
          </div>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
          <p>There was an error loading your order details. Please contact us with your order information.</p>
          <p class="mb-0 small">{{ error }}</p>
        </div>

        <div v-else-if="order" class="card shadow-sm ticket">
          <div class="card-body p-5">
            <h1 class="fw-bold fs-4 text-success mb-3">Thank you for your order!</h1>
            <p class="">
              Order number : <strong>{{ order.orderNumber }}</strong>.
            </p>
            <ul class="list-unstyled text-muted mt-4">
              <li><strong>Total:</strong> €{{ order.totalAmount.toFixed(2) }}</li>
              <li><strong>Shipping:</strong> {{ order.shippingMethodName }}</li>
              <li><strong>Payment Status:</strong> <span class="text-capitalize">{{ order.paymentStatus }}</span></li>
            </ul>
            <p class="text-muted mt-4">A confirmation email with the full details will be sent to <strong> {{ order.customerEmail }}</strong>.</p>
            <RouterLink to="/" class="btn btn-primary">
              Return to Homepage
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiClient from '@/utils/apiClient';

const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  const orderId = route.params.id;
  const token = route.params.token;

  if (!orderId) {
    error.value = 'No order ID provided.';
    loading.value = false;
    return;
  }

  try {
    let endpoint = '';

    // If a viewToken is present (guest or just-placed order), use the public route
    if (token) {
      endpoint = `/orders/public/confirmation/${orderId}/${token}`;
    } else {
      // If no token, it's a logged-in user viewing history. Use the protected confirmation route.
      endpoint = `/orders/confirmation/${orderId}`;
    }

    const fetchedOrderDetails = await apiClient(endpoint);
    order.value = fetchedOrderDetails;

  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.card {
  border: none;
}
</style>