// File: src/composables/useNotifier.js
import { reactive } from 'vue';

// This reactive array is the single source of truth for all notifications.
export const notifications = reactive([]);

const removeNotificationById = (id) => {
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.splice(index, 1);
  }
};

// This is the globally accessible function to add new notifications.
export const addNotification = (message, type = 'info', duration = 5000) => {
  const id = Date.now() + Math.random();
  notifications.push({ id, message, type });

  setTimeout(() => {
    removeNotificationById(id);
  }, duration);
};

// The composable hook is a convenient wrapper for components.
export function useNotifier() {
  return {
    notifications,
    addNotification,
    removeNotification: removeNotificationById
  };
}