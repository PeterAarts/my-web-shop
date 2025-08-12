<template>
  <div class="container my-5" style="max-width: 500px;">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h2 class="card-title text-center mb-4">Set a New Password</h2>

        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
          <RouterLink to="/login" class="alert-link"> Click here to login.</RouterLink>
        </div>

        <form v-else @submit.prevent="handleResetPassword">
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
          <div class="mb-3">
            <label for="new-password" class="form-label">New Password</label>
            <input type="password" v-model="form.password" id="new-password" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="confirm-password" class="form-label">Confirm New Password</label>
            <input type="password" v-model="form.confirmPassword" id="confirm-password" class="form-control" required>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const route = useRoute();
const authStore = useAuthStore();

const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const form = reactive({
  password: '',
  confirmPassword: ''
});

const handleResetPassword = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match.';
    return;
  }
  if (!route.params.token) {
    error.value = 'Invalid or missing reset token.';
    return;
  }

  loading.value = true;
  error.value = '';
  successMessage.value = '';
  
  try {
    const result = await authStore.resetPassword(route.params.token, form.password);
    successMessage.value = result.msg;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>