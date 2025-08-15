<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <RouterLink :to="{ name: 'dashboard' }" class="sidebar-header">
        <i class="ph-bold ph-storefront fs-4 me-2"></i>
        <span class="fs-4 nav-text">Shop Manager</span>
      </RouterLink>

      <div v-if="loggedInUser" class="user-info">
        <i class="ph ph-user-circle me-2 fs-5"></i>
        <span class="small nav-text">{{ loggedInUser }}</span>
        <button @click="toggleTheme" class="btn btn-outline-secondary ms-auto border-0 theme-toggle"><i class="ph " :class="theme === 'dark' ? 'ph-sun' : 'ph-moon'"></i></button>
      </div>
      <hr>

      <ul class="nav nav-pills flex-column mb-auto">
        <li class="nav-item">
          <RouterLink :to="{ name: 'dashboard' }" class="nav-link link-body-emphasis my-1" exact-active-class="active">
            <i class="ph-duotone ph-gauge me-2"></i> <span class="nav-text">Dashboard</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'products' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-package me-2"></i> <span class="nav-text">Products</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'categories' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-tag me-2"></i> <span class="nav-text">Categories</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'users' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-users me-2"></i> <span class="nav-text">Users</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'stories' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-book-open-text me-2"></i> <span class="nav-text">Stories</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'orders' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-receipt me-2"></i> <span class="nav-text">Orders</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'images' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-image me-2"></i> <span class="nav-text">Images</span>
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink :to="{ name: 'email-templates' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-envelope-simple me-2"></i> <span class="nav-text">E-mail templates</span>
          </RouterLink>
        </li>
        <li class="nav-item mt-auto border-top pt-2">
          <RouterLink :to="{ name: 'settings' }" class="nav-link link-body-emphasis my-1" active-class="active">
            <i class="ph-duotone ph-gear me-2"></i> <span class="nav-text">Settings</span>
          </RouterLink>
        </li>
      </ul>

      <div class="logout-section">
        <hr class="my-4">
        <button @click="logout" class="btn btn-secondary w-100">
          <i class="ph ph-sign-out me-2"></i>
          <span class="nav-text">Logout</span>
        </button>
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
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 280px; /* Default sidebar width for desktop */
  padding: 1rem;
  /* ADDED: Smooth transition for width and other properties */
  transition: width 0.3s ease-in-out;
}

/* ADDED: Styles for the sidebar header and user info */
.sidebar-header, .user-info {
  display: flex;
  align-items: center;
  text-decoration: none;
  overflow: hidden; /* Prevents text from wrapping on collapse */
  white-space: nowrap; /* Prevents text from wrapping */
}

.nav-link {
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.nav-link i {
  vertical-align: middle;
}

.logout-section {
  margin-top: auto;
  padding-top: 0.5rem;
}

.main-content {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
}

/* --- ADDED: Responsive Styles for tablet and mobile --- */
@media (max-width: 992px) {
  .sidebar {
    /* Collapse the sidebar width */
    width: 50px;
  }

  /* Hide all text elements with the nav-text class */
  .sidebar .nav-text {
    display: none;
  }

  /* Center the icons and content in the collapsed sidebar */
  .sidebar-header, .nav-link, .logout-section .btn {
    justify-content: center;
  }

  /* Remove margin from icons since text is gone */
  .sidebar i.me-2 {
    margin-right: 0 !important;
  }

  /* Adjust the theme toggle button position */
  .user-info .theme-toggle {
    margin-left: 0 !important;
  }
}
</style>