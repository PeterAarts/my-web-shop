<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <RouterLink :to="{ name: 'dashboard' }" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
        <i class="ph-bold ph-storefront fs-4 me-2"></i>
        <span class="fs-4 col-md">Shop Manager</span>
      </RouterLink>
      <div v-if="loggedInUser" class="d-flex align-items-center justify-content-left">
        <i class="ph ph-user-circle me-2 fs-5"></i>
        <span class="small">{{ loggedInUser }}</span>
        <button @click="toggleTheme" class="btn btn-outline-secondary ms-2 ms-auto border-0"><i class="ph " :class="theme === 'dark' ? 'ph-sun' : 'ph-moon'"></i></button>
      </div>
      <hr>
      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
          <RouterLink :to="{ name: 'dashboard' }" class="nav-link link-body-emphasis my-1" exact-active-class="active">
            <i class="ph-duotone ph-gauge me-2"></i> Dashboard
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'products' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-package me-2"></i> Products
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'categories' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-tag me-2"></i> Categories
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'users' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-users me-2"></i> Users
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'stories' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-book-open-text me-2"></i> Stories
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'orders' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-receipt me-2"></i> Orders
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'images' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-image me-2"></i> Images
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'email-templates' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-receipt me-2"></i> E-mail templates
          </RouterLink>
        </li>
        <li class="nav-item mt-auto border-top pt-2">
          <RouterLink :to="{ name: 'settings' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-gear me-2"></i> Settings
          </RouterLink>
        </li>
      </ul>

      <div class="mt-auto pt-2 text-center">

        <hr class="my-4">
        <button @click="logout" class="btn btn-secondary w-100">Logout</button>
      </div>
    </aside>

    <main class="main-content">
      <div class="container-fluid">
        <RouterView />
      </div>
    </main>
<Notification />
    <ImagePicker 
      ref="globalImagePickerRef" 
      modalId="globalImagePicker"
      @imageSelected="onGlobalImageSelected"
    />
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import apiClient from '@/utils/apiClient'; // Import the admin's apiClient
import ImagePicker from '@/components/ImagePicker.vue'; 
import eventBus from '@/utils/eventBus'; 
import Notification from '@/components/Notification.vue';

const router = useRouter();
const loggedInUser = ref(''); // Initialize as empty
const theme = ref(localStorage.getItem('adminTheme') || 'dark');

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

watchEffect(() => {
  document.documentElement.setAttribute('data-bs-theme', theme.value);
  localStorage.setItem('adminTheme', theme.value);
});

// UPDATED: Logout function to be consistent with apiClient
const logout = () => {
  localStorage.removeItem('authToken'); // Uses 'authToken' as seen in apiClient
  loggedInUser.value = ''; // Clear the username
  router.push({ name: 'login' });
};

// --- Global Image Picker Logic ---
const globalImagePickerRef = ref(null);
let imageSelectionCallback = null;
const openGlobalImagePicker = (callback) => { /* ... unchanged ... */ };
const onGlobalImageSelected = (imagePath) => { /* ... unchanged ... */ };


// ADDED: Function to fetch the current user's data
const fetchCurrentUser = async () => {
  try {
    // The apiClient will automatically use the token from localStorage
    const user = await apiClient('/users/me');
    loggedInUser.value = user.username;
  } catch (error) {
    console.error("Could not fetch current user:", error);
    // The apiClient will handle redirecting to login on 401 errors
  }
};

onMounted(() => {
  eventBus.on('open-image-picker', openGlobalImagePicker);
  fetchCurrentUser(); // Fetch user data when the layout loads
});
</script>

<style scoped>
/* Styles are unchanged */
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 280px;
  padding: 1rem;
}
.main-content {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
}
.nav-link i {
    vertical-align: middle;
}
</style>