<!-- File: src/views/LoginView.vue -->
<template>
  <div class="d-flex align-items-center justify-content-center vh-100 bg-body-primary">
    <div class="col-md-2">
      <div class="card p-3 shadow">
        <div class="card-body">
          <h3 class="card-title text-center mb-2">Admin Login</h3>
          <p class="card-text text-center text-muted mb-4">Enter your credentials to access the dashboard.</p>
          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" v-model="loginForm.username" id="username" required class="form-control" />
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" v-model="loginForm.password" id="password" required class="form-control" />
            </div>
            <p v-if="loginError" class="text-danger small mt-3">{{ loginError }}</p>
            <button type="submit" class="btn btn-primary w-100 mt-3" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Logging in...' : 'Log In' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/utils/apiClient'; // Import our apiClient


const router = useRouter()
const loginForm = reactive({ username: '', password: '' })
const loginError = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loginError.value = ''
  loading.value = true;
  try {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      body: loginForm 
    });
    
    localStorage.setItem('authToken', data.token);
    
    // --- SIMPLIFIED: apiClient will show a success message for the archive call ---
    // Trigger the archive process but don't wait for it to finish
    apiClient('/orders/archive', { method: 'POST' })
      .then(result => {
        // The apiClient already shows a success notification.
        // We can still log for debugging.
        console.log('Background archive result:', result.msg);
      })
      .catch(err => {
        // The apiClient already shows a failure notification.
        console.error('Background archive process failed:', err);
      });

    // Immediately redirect to the dashboard
    router.push({ name: 'dashboard' });

  } catch (error) {
    // apiClient will handle the notification, but we can still set a local error message
    loginError.value = error.message;
  } finally {
    loading.value = false;
  }
}
</script>
