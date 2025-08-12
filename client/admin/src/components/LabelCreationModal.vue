<template>
  <div class="modal fade" id="labelModal" tabindex="-1" ref="modalRef">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Create Label for Order #{{ order.orderNumber }}</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body">
          <div v-if="loading" class="text-center">
            <div class="spinner-border"></div>
            <p class="mt-2">Fetching shipping rates...</p>
          </div>
          <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
          <div v-else-if="rates.length === 0" class="alert alert-warning">
            No shipping rates could be found for this order's destination and weight.
          </div>
          <div v-else>
            <p>Please select a shipping rate:</p>
            <div v-for="rate in rates" :key="rate.id" class="form-check">
              <input class="form-check-input" type="radio" :value="rate.id" v-model="selectedRateId" :id="rate.id">
              <label class="form-check-label" :for="rate.id">
                {{ rate.name }} - <strong>€{{ rate.price.toFixed(2) }}</strong>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="close">Cancel</button>
          <button
            type="button"
            class="btn btn-primary"
            @click="confirmLabelCreation"
            :disabled="!selectedRateId || isCreating"
          >
            <span v-if="isCreating" class="spinner-border spinner-border-sm"></span>
            Confirm & Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
import apiClient from '@/utils/apiClient';

const emit = defineEmits(['label-created']);
const props = defineProps({ order: { type: Object, required: true } });

const modalRef = ref(null);
let modalInstance = null;

const loading = ref(true);
const isCreating = ref(false);
const error = ref('');
const rates = ref([]);
const selectedRateId = ref(null);

const fetchRates = async () => {
  if (!props.order._id) return;
  loading.value = true;
  error.value = '';
  rates.value = [];
  try {
    const response = await apiClient('/shipping/rates', {
      method: 'POST',
      body: {
        address: props.order.customerDetails.address, // Assuming address object exists
        cartItems: props.order.items,
      }
    });
    rates.value = response.rates;
  } catch (e) {
    error.value = e.message || 'Failed to fetch rates.';
  } finally {
    loading.value = false;
  }
};

const confirmLabelCreation = async () => {
  isCreating.value = true;
  try {
    await apiClient('/shipping/label', {
      method: 'POST',
      body: {
        orderId: props.order._id,
        rateId: selectedRateId.value,
      },
    });
    emit('label-created');
    close();
  } catch (e) {
    // Error notification is handled by apiClient
  } finally {
    isCreating.value = false;
  }
};

const open = () => {
  fetchRates();
  modalInstance?.show();
};
const close = () => modalInstance?.hide();

defineExpose({ open });

onMounted(() => {
  modalInstance = new window.bootstrap.Modal(modalRef.value);
});
onUnmounted(() => {
  modalInstance?.dispose();
});
</script>