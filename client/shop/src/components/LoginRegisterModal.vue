<template>
  <div class="modal fade" id="loginRegisterModal" tabindex="-1" ref="modalRef">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ title }}</h5>
          <button type="button" class="btn-close" @click="authStore.closeLoginModal"></button>
        </div>
        <div class="modal-body">
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
                <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                {{ loading ? 'Logging in...' : 'Login' }}
              </button>
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
            <div class="alert alert-secondary small">
               By creating an account, you acknowledge that your personal data will be stored and all orders will be related to this account. If you delete your account, all order history will be removed.
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                {{ loading ? 'Registering...' : 'Create Account' }}
              </button>
            </div>
          </form>

          <form v-if="mode === 'forgot'" @submit.prevent="handleForgotPassword">
            <p class="text-muted small">Enter your email address and we will send you a link to reset your password.</p>
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
          </form>

          <div class="text-center mt-3">
            <a v-if="mode === 'login'" href="#" @click.prevent="setMode('register')" class="link-secondary">
              Don't have an account? Register
            </a>
            <a v-if="mode === 'register'" href="#" @click.prevent="setMode('login')" class="link-secondary">
              Already have an account? Login
            </a>
            <a v-if="mode === 'forgot'" href="#" @click.prevent="setMode('login')" class="link-secondary">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { Modal } from 'bootstrap';

const authStore = useAuthStore();
const modalRef = ref(null);
let modalInstance = null;

// UPDATED: Switched to a string 'mode' for three states
const mode = ref('login'); // 'login', 'register', or 'forgot'
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

const loginForm = reactive({ email: '', password: '' });
const registerForm = reactive({ username: '', email: '', password: '' });

// NEW: Form state for forgot password
const forgotPasswordForm = reactive({ email: '' });

// NEW: Dynamic title for the modal
const title = computed(() => {
  if (mode.value === 'register') return 'Create an Account';
  if (mode.value === 'forgot') return 'Reset Password';
  return 'Login';
});

watch(() => authStore.showLoginModal, (show) => {
  if (show) {
    modalInstance?.show();
  } else {
    modalInstance?.hide();
  }
});

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(loginForm);
    authStore.closeLoginModal();
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
    // Don't switch mode, show the success message
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

// NEW: Function to handle the forgot password request
const handleForgotPassword = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    const result = await authStore.forgotPassword(forgotPasswordForm.email);
    successMessage.value = result.msg;
    forgotPasswordForm.email = '';
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

onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      authStore.closeLoginModal();
    });
  }
});

onUnmounted(() => {
  modalInstance?.dispose();
});
</script>