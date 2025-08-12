<!-- FILE: src/layouts/ShopLayout.vue -->
<template>
  <div v-if="serverError" class="d-flex flex-column min-vh-100 justify-content-center align-items-center text-center p-4 bg-light">
    <i class="ph-fill ph-plugs-connected fs-1 text-danger mb-3"></i>
    <h1 class="display-5">Sorry, the shop is temporarily unavailable.</h1>
    <p class="lead text-muted">{{ serverError }}</p>
    <p class="mt-3">Our apologies for the inconvenience. Please check back again later.</p>
  </div>
  <!-- UPDATED: Added style binding for theme variables -->
  <div v-else class="shop-layout-container d-flex flex-column min-vh-100" :style="themeStyles">
    <!-- Header Section -->
    <header class="text-white text-center position-relative d-flex flex-column" 
            :style="{ 
              backgroundImage: `url(${headerImageUrl})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center', 
              minHeight: '250px',
              paddingBottom: navHeight + 'px' 
            }">
      <div class="header-overlay position-absolute top-0 start-0 w-100 h-100" style="background-color: rgba(0, 0, 0, 0.5);"></div>
      
      <RouterLink to="/" class="container position-relative my-auto text-white text-decoration-none">
        <h1 class="display-3 fw-bold">{{ shopTitle }}</h1>
        <p class="lead">{{ shopSubtitle }}</p>
      </RouterLink>
    </header>

    <!-- Sticky Navigation Bar -->
    <nav ref="navbarRef" 
         class="navbar navbar-expand-lg sticky-top "
         :class="{ 'scrolled-nav': isScrolled, 'bg-primary': isScrolled }"
         :style="{ marginTop: '-' + navHeight + 'px' }">
      <div class="container">
        <RouterLink class="navbar-brand fw-bold" :class="{ 'brand-visible': isScrolled }" to="/">{{ shopTitle }}</RouterLink>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto me-5 align-items-center">
            <li class="nav-item">
              <RouterLink class="nav-link" to="/shop">Shop</RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" to="/about">About</RouterLink>
            </li>
            <li class="nav-item d-none d-lg-block mx-2">
              <div class="vr text-white"></div>
            </li>
            <UserDropdown :allow-registration="settings.allowShopRegistration" />
            <li class="nav-item d-none d-lg-block mx-2">
              <div class="vr text-white"></div>
            </li>
            <!-- Social Icons -->
            <li v-if="instagramUrl" class="nav-item">
              <a class="nav-link" :href="instagramUrl" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i class="ph-fill ph-instagram-logo fs-5"></i>
              </a>
            </li>
            <li v-if="facebookUrl" class="nav-item">
              <a class="nav-link" :href="facebookUrl" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i class="ph-fill ph-facebook-logo fs-5"></i>
              </a>
            </li> 
            <li v-if="twitterUrl" class="nav-item">
              <a class="nav-link" :href="twitterUrl" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i class="ph-fill ph-twitter-logo fs-5"></i>
              </a>    
            </li>
            <li class="nav-item d-none d-lg-block mx-2">
              <div class="vr text-white"></div>
            </li>
            <li class="nav-item">
              <CartDropdown />
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main v-if="!isLoadingSettings" :class="mainContainerClass" :style="mainContainerStyle" class="py-4">
      <!-- FIX 1: Pass settings as a prop to the component rendered by RouterView -->
      <RouterView :settings="settings" />
    </main>
    <div v-else class="d-flex justify-content-center align-items-center flex-grow-1">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>


    <!-- Footer -->
    <footer class="bg-primary text-white text-center p-4 mt-auto">
      <div class="container">
        <p class="mb-0" style="white-space: pre-wrap;">{{ footerText }}</p>
      </div>
    </footer>
    <LoginRegisterModal />
    <ConfirmationModal />
  </div>
</template>

<script setup>
// FIX 2: Removed 'provide' as it's no longer needed for this approach
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useCartStore } from '@/store/cartStore';
import CartDropdown from '@/components/CartDropdown.vue';
import UserDropdown from '@/components/UserDropdown.vue';
import LoginRegisterModal from '@/components/LoginRegisterModal.vue';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const settings = ref({});
const serverError = ref(null);
const isLoadingSettings = ref(true);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const navbarRef = ref(null);
const navHeight = ref(0);
const isScrolled = ref(false);

// REMOVED: provide('settings', settings);

const shopTitle = computed(() => settings.value.shopTitle || 'My Shop');
const shopSubtitle = computed(() => settings.value.shopSubtitle);
const footerText = computed(() => settings.value.footerText || `© ${new Date().getFullYear()} ${shopTitle.value}. All Rights Reserved.`);

const instagramUrl = computed(() => settings.value.instagramUrl);
const facebookUrl = computed(() => settings.value.facebookUrl);
const twitterUrl = computed(() => settings.value.twitterUrl);

const themeStyles = computed(() => {
  return {
    '--bs-primary': settings.value.primaryColor || '#9D9DCC',
  };
});

const headerImageUrl = computed(() => {
  if (settings.value.headerImageUrl) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl.replace('/api', '')}${settings.value.headerImageUrl}`;
  }
  return 'https://placehold.co/1920x250/9D9DCC/FFFFFF?text=Your+Header+Image';
});

const mainContainerClass = computed(() => {
  return settings.value.pageLayout === 'full-width' ? 'container-fluid' : 'container';
});

const mainContainerStyle = computed(() => {
  if (settings.value.pageLayout === 'contained' && settings.value.contentMaxWidth > 0) {
    return { maxWidth: `${settings.value.contentMaxWidth}px` };
  }
  return {};
});

const fetchSettings = async () => {
  try {
    const response = await fetch(`${apiUrl}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings from the server.');
    settings.value = await response.json();
  } catch (error) {
    console.error("Could not fetch settings:", error);
    serverError.value = error.message;
  } finally {
    isLoadingSettings.value = false;
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 0;
};

onMounted(async () => {
  await fetchSettings();
  if (serverError.value) return;

  await nextTick(); 
  if (navbarRef.value) {
    navHeight.value = navbarRef.value.offsetHeight;
  }
  window.addEventListener('scroll', handleScroll);
  cartStore.init();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.navbar {
  background-color: transparent;
  transition: background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}
.navbar.scrolled-nav {
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.navbar-brand {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}
.navbar-brand.brand-visible {
  opacity: 1;
}
.vr {
  height: 20px;
  opacity: 0.25;
}
.flex-grow-1 {
  flex-grow: 1;
}
</style>