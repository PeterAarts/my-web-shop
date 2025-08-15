<template>
  <div>
    <div v-if="cartStore.items.length === 0" class="text-center text-muted py-5 bg-light rounded">
      <h2>Your cart is empty.</h2>
      <p>You can't proceed to checkout without any items.</p>
      <RouterLink to="/shop" class="btn btn-primary mt-3">Continue Shopping</RouterLink>
    </div>

    <div v-else>
      <h1 class="mb-4">Checkout</h1>
      <div class="row g-5">
        <div class="col-lg-7">
          <div class="accordion" id="checkoutAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header" id="headingOne">
                <button class="accordion-button d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                  <span class="badge bg-primary me-3">1</span>
                  <span class="card-title col-4">Shipping Address</span>
                  <span v-if="shippingAddress.isSet" class="text-muted small">{{ shippingAddress.street }}, {{ shippingAddress.city }}, {{ shippingCountryName }}</span>
                </button>
              </h2>
              <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#checkoutAccordion">
                <div class="accordion-body">
                  <form @submit.prevent="handleAddressSubmit">
                    <div class="row g-3">
                      <div class="col-12"><label for="fullName" class="form-label">Full Name</label><input type="text" :value="shippingAddress.name" @input="cartStore.setShippingAddress({ name: $event.target.value })" class="form-control" id="fullName" required></div>
                      
                      <div class="col-12">
                        <label for="email" class="form-label">Email Address</label>
                        <input type="email" id="email" class="form-control" :value="shippingAddress.email" @input="cartStore.setShippingAddress({ email: $event.target.value })" required>
                      </div>

                      <div class="col-12"><label for="address" class="form-label">Address</label><input type="text" :value="shippingAddress.street" @input="cartStore.setShippingAddress({ street: $event.target.value })" class="form-control" id="address" placeholder="Street and house number" required></div>
                      <div class="col-md-6"><label for="city" class="form-label">City</label><input type="text" :value="shippingAddress.city" @input="cartStore.setShippingAddress({ city: $event.target.value })" class="form-control" id="city" required></div>
                      <div class="col-md-6"><label for="postalCode" class="form-label">Postal Code</label><input type="text" :value="shippingAddress.postalCode" @input="cartStore.setShippingAddress({ postalCode: $event.target.value })" class="form-control" id="postalCode" required></div>
                      <div class="col-12">
                        <label for="country" class="form-label">Country</label>
                        <select :value="shippingAddress.countryCode" @change="cartStore.setShippingAddress({ countryCode: $event.target.value })" class="form-select" id="country" required>
                          <option disabled value="">Please select a country</option>
                          <option v-for="country in countries" :key="country.code" :value="country.code">{{ country.name }}</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-4" :disabled="loadingShipping">
                       <span v-if="loadingShipping" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                       {{ loadingShipping ? 'Calculating...' : 'Continue to Shipping' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div class="accordion-item">
              <h2 class="accordion-header" id="headingTwo">
                <button class="accordion-button collapsed d-flex" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo" :disabled="!shippingAddress.isSet">
                  <span class="badge me-3" :class="shippingAddress.isSet ? 'bg-primary' : 'bg-secondary'">2</span>
                  <span class="card-title col-4">Shipping Options</span>
                  <span v-if="selectedShipping" class="text-muted small">{{ selectedShipping.name }} (€{{ selectedShipping.price.toFixed(2) }})</span>
                </button>
              </h2>
              <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#checkoutAccordion">
                <div class="accordion-body">
                  <p v-if="loadingShipping" class="text-muted">Loading shipping options...</p>
                  <div v-else-if="shippingError" class="alert alert-danger">{{ shippingError }}</div>
                  <div v-else-if="!loadingRates && shippingOptions.length > 0">
                  <p v-if="totalWeight > 0" class="text-muted mb-3">Total shipping weight: <strong>{{ totalWeight }}g</strong></p>
                    <div v-for="option in shippingOptions" :key="option.id" class="form-check ms-4 my-2">
                      <input class="form-check-input" type="radio" name="shippingOption" :id="`shipping-${option.id}`" :value="option" v-model="selectedShipping">
                      <label class="form-check-label w-100" :for="`shipping-${option.id}`">{{ option.name }}<span class="float-end fw-bold">€{{ option.price.toFixed(2) }}</span></label>
                    </div>
                    <button @click="handleShippingSubmit" class="btn btn-primary mt-4" :disabled="!selectedShipping">Continue to Payment</button>
                  </div>
                  <p v-else class="alert alert-danger">Sorry, No shipping options available, please contact us via Instagram.</p>
                </div>
              </div>
            </div>

            <div class="accordion-item">
                <h2 class="accordion-header" id="headingThree">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree" :disabled="!selectedShipping">
                    <span class="badge me-3" :class="selectedShipping ? 'bg-primary' : 'bg-secondary'">3</span>
                    <span class="card-title col-4">Payment</span>
                    <span v-if="selectedPaymentOption" class="text-muted small">{{ selectedPaymentOption.name }}</span>
                  </button>
                </h2>
                <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#checkoutAccordion">
                  <div class="accordion-body">
                    <div v-if="loadingPayments" class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>
                    <div v-else-if="paymentError" class="alert alert-danger">{{ paymentError }}</div>
                    
                    <div v-else-if="paymentOptions.length > 0">
                      <div v-for="option in paymentOptions" :key="option._id" class="form-check ms-4 my-3">
                        <input class="form-check-input" type="radio" name="paymentOption" :id="`payment-${option._id}`" :value="option" v-model="selectedPaymentOption">
                        <label class="form-check-label" :for="`payment-${option._id}`"><strong>{{ option.name }}</strong></label>
                      </div>
                      <div v-if="selectedPaymentOption" class="ms-4  p-3 bg-light rounded">
                        <div v-if="!selectedPaymentOption.isOnline">
                          <p style="white-space: pre-wrap;" class="text-muted">{{ selectedPaymentOption.instructions }}</p>
                          <button @click="initiatePayment" class="btn btn-primary">Place Order</button>
                        </div>
                        <div v-if="selectedPaymentOption.isOnline">
                          <p>Click the button below to proceed with {{selectedPaymentOption.name}}.</p>
                          <button @click="initiatePayment" class="btn btn-primary">Proceed to {{ selectedPaymentOption.name }}</button>
                          <div id="paypal-button-container" class="mt-3"></div>
                        </div>
                      </div>
                    </div>
                    <div v-else-if="!authStore.isAuthenticated && registeredOnlyOptions.length > 0" class="alert alert-primary">
                      <p class="fw-bold mb-2">Additional payment options are available for registered users:</p>
                      <ul class="mb-3">
                        <li v-for="optionName in registeredOnlyOptions" :key="optionName">{{ optionName }}</li>
                      </ul>
                      <a href="#" @click.prevent="authStore.openLoginModal()" class="btn btn-sm btn-primary">Login or create an account</a> to access these options.
                    </div>

                    <p v-else class="text-muted">No payment options are available for your region.</p>
                  </div>
                </div>
              </div>
          </div>
        </div>

        <div class="col-lg-5">
            <div class="card shadow-sm sticky-top ticket" style="top: 20px;">
                <div class="card-body">
                <h4 class="card-title mb-4">Your Order</h4>
                <ul class="list-group list-group-flush">
                    <li v-for="item in cartStore.items" :key="item._id" class="list-group-item d-flex justify-content-between align-items-center px-0">
                    <div><h6 class="my-0">{{ item.name }}</h6><small class="text-muted">Quantity: {{ item.quantity }}</small></div>
                    <span class="text-muted">€{{ (item.price * item.quantity).toFixed(2) }}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center px-0"><span>Subtotal</span><strong>€{{ cartStore.cartTotalPrice.toFixed(2) }}</strong></li>
                    <li v-if="selectedShipping" class="list-group-item d-flex justify-content-between align-items-center px-0"><span>Shipping</span><strong>€{{ selectedShipping.price.toFixed(2) }}</strong></li>
                </ul>
                <hr>
                <div class="d-flex justify-content-between fw-bold fs-5 px-0"><span>Total</span><span>€{{ finalTotal.toFixed(2) }}</span></div>
                </div>
            </div>
        </div>
      </div>

      <div class="row mt-5">
        <div class="col-12">
            <StoryList 
              v-if="checkoutPageStories.length > 0"
              :stories="checkoutPageStories"
              title="our stories"
            />
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useCartStore } from '@/store/cartStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { useRouter } from 'vue-router';
import { RouterLink } from 'vue-router';
import { storeToRefs } from 'pinia';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { countries } from '@/data/countries.js';
import { loadScript } from '@/utils/scriptLoader.js'; 
import StoryList from '../components/StoryList.vue';
import apiClient from '@/utils/apiClient'; 

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const { shippingAddress } = storeToRefs(cartStore);

// State variables
const shippingOptions = ref([]);
const selectedShipping = ref(null);
const loadingShipping = ref(false);
const shippingError = ref('');
const totalWeight = ref(0);
const paymentOptions = ref([]);
const registeredOnlyOptions = ref([]); 
const selectedPaymentOption = ref(null);
const loadingPayments = ref(false);
const paymentError = ref('');

// 1. Declare the reactive variable for stories
const checkoutPageStories = ref([]);


// (All computed properties and other functions remain the same)
const shippingCountryName = computed(() => {
  if (!shippingAddress.value.countryCode) return '';
  const country = countries.find(c => c.code === shippingAddress.value.countryCode);
  return country ? country.name : shippingAddress.value.countryCode;
});
const finalTotal = computed(() => {
  const shippingPrice = selectedShipping.value ? selectedShipping.value.price : 0;
  return cartStore.cartTotalPrice + shippingPrice;
});

const handleAddressSubmit = async () => {
  loadingShipping.value = true;
  shippingError.value = '';
  try {
    const response = await fetch(`${apiUrl}/shipping/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: shippingAddress.value, cartItems: cartStore.items.map(item => ({ productId: item._id, quantity: item.quantity })) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.msg || 'Failed to get shipping rates.');
    cartStore.setShippingAddress({ isSet: true });
    shippingOptions.value = data.rates;
    totalWeight.value = data.totalWeight;
    selectedShipping.value = data.rates?.[0] || null;
    const collapseOneEl = document.getElementById('collapseOne');
    const collapseTwoEl = document.getElementById('collapseTwo');
    if (collapseOneEl && collapseTwoEl) {
        bootstrap.Collapse.getOrCreateInstance(collapseOneEl).hide();
        bootstrap.Collapse.getOrCreateInstance(collapseTwoEl).show();
    }
    // The API now successfully returns a `rates` array, even if it's empty.
    if (response.rates && response.rates.length > 0) {
      shippingRates.value = response.rates;
    } else {
      // Handle the case where the array is empty (e.g., zero-weight order)
      console.warn("No shipping rates were returned by the API.");
    }
  } catch (error) {
    shippingError.value = error.message;
  } finally {
    loadingShipping.value = false;
  }
};

const fetchPaymentOptions = async () => {
  loadingPayments.value = true;
  paymentError.value = '';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }
    const response = await fetch(`${apiUrl}/payment/options`, { headers });
    if (!response.ok) throw new Error('Could not load payment options.');
    
    const data = await response.json();
    paymentOptions.value = data.available;
    registeredOnlyOptions.value = data.requiresRegistration;

    if (paymentOptions.value && paymentOptions.value.length === 1) {
      selectedPaymentOption.value = paymentOptions.value[0];
    }

  } catch (err) {
    paymentError.value = err.message;
  } finally {
    loadingPayments.value = false;
  }
};

const handleShippingSubmit = () => {
  fetchPaymentOptions();
  const collapseTwoEl = document.getElementById('collapseTwo');
  const collapseThreeEl = document.getElementById('collapseThree');
  if (collapseTwoEl && collapseThreeEl) {
    bootstrap.Collapse.getOrCreateInstance(collapseTwoEl).hide();
    bootstrap.Collapse.getOrCreateInstance(collapseThreeEl).show();
  }
};

const initiatePayment = async () => {
  if (!selectedPaymentOption.value) return;
  paymentError.value = '';

  const orderDetails = {
    customerDetails: {
      name: shippingAddress.value.name,
      email: shippingAddress.value.email,
      address: `${shippingAddress.value.street}, ${shippingAddress.value.postalCode} ${shippingAddress.value.city}, ${shippingAddress.value.countryCode}`
    },
    structuredAddress: shippingAddress.value,
    items: cartStore.items.map(item => ({ productId: item._id, name: item.name, quantity: item.quantity, price: item.price })),
    shippingDetails: {
      shippingMethodId: selectedShipping.value.id,
      shippingMethodName: selectedShipping.value.name,
      shippingCost: selectedShipping.value.price
    },
    paymentDetails: {
      paymentMethod: selectedPaymentOption.value.moduleName, 
      paymentStatus: 'pending'
    },
    totalAmount: finalTotal.value,
    shippingCost: selectedShipping.value.price
  };

  const payload = {
    paymentMethod: selectedPaymentOption.value.moduleName,
    orderDetails: orderDetails,
  };

  try {
    const response = await fetch(`${apiUrl}/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authStore.token}` },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
        if (data.outOfStockItems) {
            paymentError.value = `Sorry, "${data.outOfStockItems[0].name}" is no longer available. Please adjust your cart.`;
        } else { throw new Error(data.msg || 'Failed to initiate payment.'); }
        return;
    }
    if (data.action === 'confirm') { // Bank Transfer
      // If the user is logged in, clear their cart on the server.
      if (authStore.isAuthenticated) {
        await apiClient('/cart', { method: 'DELETE' });
      }
      cartStore.clearCart();
      router.push({ name: 'OrderConfirmation', params: { id: data.order._id } });
    } else if (data.action === 'pay') { // PayPal
      renderPayPalButtons(data.paypalOrderID, orderDetails);
    }
  } catch (error) {
    paymentError.value = error.message;
  }
};

const renderPayPalButtons = async (paypalOrderID, orderDetails) => {
  try {
    const paypalSdkUrl = `https://www.paypal.com/sdk/js?client-id=${selectedPaymentOption.value.clientId}&currency=EUR`;
    await loadScript(paypalSdkUrl);
    await nextTick();

    const container = document.getElementById('paypal-button-container');
    if(container) container.innerHTML = '';

    if (!window.paypal) throw new Error("PayPal script did not load.");

    paypal.Buttons({
      createOrder: (data, actions) => paypalOrderID,
      onApprove: async (data, actions) => {
        const capturedPaymentDetails = {
          paymentMethod: 'PayPal',
          paymentStatus: 'paid',
          paymentDate: new Date().toISOString(),
          paymentTransactionId: data.orderID,
        };

        const response = await fetch(`${apiUrl}/payment/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentModule: 'paypal',
            paymentDetails: capturedPaymentDetails, // Send the single, final details object
            orderDetails: { /* ... original orderDetails ... */ }
          })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.msg);
        if (authStore.isAuthenticated) {
          await apiClient('/cart', { method: 'DELETE' });
        }
        cartStore.clearCart();
        router.push({ name: 'OrderConfirmation', params: { id: result.order._id } });
      },
      onError: (err) => { paymentError.value = 'An error occurred with the PayPal payment.'; }
    }).render('#paypal-button-container');
  } catch (error) {
      paymentError.value = error.message;
  }
};
// Function to fetch stories for the checkout page
const fetchCheckoutStories = async () => {
  try {
    const response = await fetch(`${apiUrl}/stories/location/checkout-page`);
    if (response.ok) {
      checkoutPageStories.value = await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch checkout stories:", error);
  }
};

onMounted(() => {
  if (authStore.isAuthenticated) {
    const savedAddress = authStore.user.shippingAddress;
    if (savedAddress && savedAddress.street) {
       cartStore.setShippingAddress({
        name: savedAddress.name || authStore.user.username,
        email: authStore.user.email,
        street: savedAddress.street,
        city: savedAddress.city,
        postalCode: savedAddress.postalCode,
        countryCode: savedAddress.countryCode,
      });
    } else {
      cartStore.setShippingAddress({
        name: authStore.user.username,
        email: authStore.user.email,
      });
    }
  }

  if (shippingAddress.value.isSet) {
    handleAddressSubmit();
  }
  fetchCheckoutStories();
});

</script>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: #f8f9fa;
  color: #212529;
}
.accordion-button:focus {
  box-shadow: none;
}
</style>