<template>
  <div class="container my-5" style="max-width: 500px;">
    <div class="card shadow-sm">
      <div class="card-body p-4">
        <h2 class="card-title text-center mb-4">{{ title }}</h2>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

        <form v-if="mode === 'login'" @submit.prevent="handleLogin">
          <div class="mb-3">
            <label for="login-email" class="form-label">Email</label>
            <input type="email" v-model="loginForm.email" id="login-email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="login-password" class="form-label">Password</label>
            <input type="password" v-model="loginForm.password" id="login-password" class="form-control" required>
          </div>
          <div class="text-end mb-3">
            <a href="#" @click.prevent="setMode('forgot')" class="link-secondary small">Forgot your password?</a>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>
           <div class="text-center mt-3">
            <a href="#" @click.prevent="setMode('register')" class="link-secondary">
              Don't have an account? Register
            </a>
          </div>
        </form>

        <form v-if="mode === 'register'" @submit.prevent="handleRegister">
          <div class="mb-3">
            <label for="register-username" class="form-label">Username</label>
            <input type="text" v-model="registerForm.username" id="register-username" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="register-email" class="form-label">Email</label>
            <input type="email" v-model="registerForm.email" id="register-email" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="register-password" class="form-label">Password</label>
            <input type="password" v-model="registerForm.password" id="register-password" class="form-control" required>
          </div>
          <div class="form-check mb-3">
            <input type="checkbox" v-model="registerForm.newsletterSubscribed" id="newsletter" class="form-check-input">
            <label for="newsletter" class="form-check-label">Opt-in for our newsletter</label>
          </div>
          <div class="alert alert-secondary small">
            <p class="mb-1">
              By creating an account, you acknowledge that your personal data (username, email) will be stored. 
              All orders you place will be linked to this account.
            </p>
            <p class="mb-0">
              If you request to delete your account, all associated order history will be permanently removed.
            </p>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              {{ loading ? 'Registering...' : 'Create Account' }}
            </button>
          </div>
           <div class="text-center mt-3">
            <a href="#" @click.prevent="setMode('login')" class="link-secondary">
              Already have an account? Login
            </a>
          </div>
        </form>
        
        <form v-if="mode === 'forgot'" @submit.prevent="handleForgotPassword">
          <p class="text-muted">Enter your email address and we will send you a link to reset your password.</p>
          <div class="mb-3">
            <label for="forgot-email" class="form-label">Email</label>
            <input type="email" v-model="forgotPasswordForm.email" id="forgot-email" class="form-control" required>
          </div>
          <div class="d-grid">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm"></span>
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>
          <div class="text-center mt-3">
            <a href="#" @click.prevent="setMode('login')" class="link-secondary">
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const authStore = useAuthStore();

// UPDATED: Changed from boolean to string to handle three modes
const mode = ref('login'); // Can be 'login', 'register', or 'forgot'
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

const loginForm = reactive({
  email: '',
  password: ''
});

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  newsletterSubscribed: false
});

// NEW: Form state for the forgot password feature
const forgotPasswordForm = reactive({
  email: ''
});

// NEW: Computed property for the dynamic title
const title = computed(() => {
  if (mode.value === 'register') return 'Create an Account';
  if (mode.value === 'forgot') return 'Reset Password';
  return 'Login';
});

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(loginForm);
    router.push('/account'); // Redirect to account page after login
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const result = await authStore.register(registerForm);
    successMessage.value = result.msg || 'Registration successful! Please check your email to verify your account.';
    Object.assign(registerForm, { username: '', email: '', password: '', newsletterSubscribed: false });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// NEW: Function to handle the forgot password submission
const handleForgotPassword = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const result = await authStore.forgotPassword(forgotPasswordForm.email);
    successMessage.value = result.msg; // Show the success message from the API
    forgotPasswordForm.email = ''; // Clear the form
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// UPDATED: Replaced toggleMode with a more explicit function
const setMode = (newMode) => {
  mode.value = newMode;
  error.value = '';
  successMessage.value = '';
};
</script>