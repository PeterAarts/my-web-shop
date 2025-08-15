import { reactive, readonly } from 'vue';

// A single reactive state object to hold all notifier states
const notifierState = reactive({
  notifications: [],
  confirmation: {isVisible: false,title: '', message: '',alertType: 'warning',resolvePromise: null,},
});

const removeNotificationById = (id) => {
  const index = notifierState.notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifierState.notifications.splice(index, 1);
  }
};

// --- Main Functions ---

export const addNotification = (message, type = 'info', duration = 5000) => {
  const id = Date.now() + Math.random();
  notifierState.notifications.push({ id, message, type });
  setTimeout(() => removeNotificationById(id), duration);
};

/**.
 * @param {object} options - The confirmation options.
 * @param {string} options.title - The optional title for the dialog.
 * @param {string} options.message - The main confirmation message.
 * @param {string} [options.alertType='warning'] - The type ('danger', 'warning', 'info').
 * @returns {Promise<boolean>}
 */
export const showConfirmation = ({ title = '', message, alertType = 'warning' }) => {
  notifierState.confirmation.title = title;
  notifierState.confirmation.message = message;
  notifierState.confirmation.alertType = alertType;
  notifierState.confirmation.isVisible = true;

  return new Promise((resolve) => {
    notifierState.confirmation.resolvePromise = resolve;
  });
};

/**
 * Handles the user's response from the dialog.
 * @param {boolean} response - The user's choice (true for OK, false for Cancel).
 */
const handleConfirmation = (response) => {
  if (notifierState.confirmation.resolvePromise) {
    notifierState.confirmation.resolvePromise(response);
  }
  // Reset state
  notifierState.confirmation.isVisible = false;
  notifierState.confirmation.message = '';
  notifierState.confirmation.resolvePromise = null;
};


// --- The Composable Hook ---

export function useNotifier() {
  return {
    notifications: readonly(notifierState.notifications),
    confirmation: readonly(notifierState.confirmation),
    addNotification,
    removeNotification: removeNotificationById,
    showConfirmation,
    handleConfirmation, // Expose the handler for the dialog component
  };
}