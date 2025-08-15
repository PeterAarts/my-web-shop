<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content shadow-lg">
        <div class="modal-header border-0 " :class="['modal-header', 'alert',dialogStyles.iconClass]">
          <h5 class="modal-title" v-if="confirmation.title">{{ confirmation.title }}</h5>
        </div>
        <div class="modal-body p-4 text-center">      
          <p class="mb-4" v-html="confirmation.message"></p>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-secondary px-4" @click="respond(false)">Cancel</button>
            <button type="button" class="btn px-4" :class="dialogStyles.okButtonClass" @click="respond(true)">OK</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'; // Add computed
import { useNotifier } from '@/composables/useNotifier';
import { Modal } from 'bootstrap';

const { confirmation, handleConfirmation } = useNotifier();
const modalRef = ref(null);
let modalInstance = null;

// --- NEW: Computed property to determine styles based on alertType ---
const dialogStyles = computed(() => {
  switch (confirmation.alertType) {
    case 'danger':
      return {
        iconClass: 'alert-danger',
        okButtonClass: 'btn-danger'
      };
    case 'info':
      return {
        iconClass: 'alert-primary',
        okButtonClass: 'btn-primary'
      };
    case 'warning':
    default:
      return {
        iconClass: 'alert-warning',
        okButtonClass: 'btn-warning'
      };
  }
});

onMounted(() => {
  // ... onMounted logic remains the same
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value, { backdrop: 'static', keyboard: false });
  }
});

watch(() => confirmation.isVisible, (isVisible) => {
  // ... watch logic remains the same
  if (isVisible) {
    modalInstance?.show();
  } else {
    modalInstance?.hide();
  }
});

const respond = (response) => {
  handleConfirmation(response);
};
</script>