// FILE: src/composables/useConfirm.js
import { reactive } from 'vue';

// This state is shared across the application
const state = reactive({
  isOpen: false,
  title: '',
  message: '',
  confirmButtonText: 'OK',
  cancelButtonText: 'Cancel',
  modal: null, // Holds the Bootstrap Modal instance
  resolve: null,
});

// This composable is used by the Modal component itself
export const useConfirmState = () => {
  const confirm = () => {
    state.modal.hide();
    if (state.resolve) state.resolve(true);
  };

  const cancel = () => {
    state.modal.hide();
    if (state.resolve) state.resolve(false);
  };

  return { state, confirm, cancel };
};

// This is the function you'll call from other components
export const useConfirm = () => {
  return (options) => {
    state.title = options.title || 'Are you sure?';
    state.message = options.message || 'This action cannot be undone.';
    state.confirmButtonText = options.confirmButtonText || 'OK';
    state.cancelButtonText = options.cancelButtonText || 'Cancel';
    
    state.modal.show();
    
    return new Promise((resolve) => {
      state.resolve = resolve;
    });
  };
};