<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="confirmationModalLabel">{{ state.title }}</h5>
          <button type="button" class="btn-close" @click="cancel" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>{{ state.message }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" @click="cancel">{{ state.cancelButtonText }}</button>
          <button type="button" class="btn btn-primary" @click="confirm">{{ state.confirmButtonText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Modal } from 'bootstrap';
import { useConfirmState } from '@/composables/useConfirm';

const { state, confirm, cancel } = useConfirmState();
const modalRef = ref(null);

onMounted(() => {
  const modalElement = modalRef.value;
  // Link the Bootstrap JS instance to our composable's state
  state.modal = new Modal(modalElement);
});
</script>