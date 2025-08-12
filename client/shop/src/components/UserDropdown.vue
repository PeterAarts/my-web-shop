<!-- FILE: src/components/UserDropdown.vue -->
<template>
  <!-- If user is logged in, show the dropdown -->
  <li v-if="authStore.isAuthenticated" class="nav-item dropdown">
    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="ph ph-user-circle fs-5 me-1"></i>
<!--     {{ authStore.user.username }}--> 
    </a>
    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
      <li>
        <RouterLink class="dropdown-item" to="/account">
          <i class="ph ph-user-list me-2"></i>My Account
        </RouterLink>
      </li>
      <li><hr class="dropdown-divider"></li>
      <li>
        <a class="dropdown-item" href="#" @click.prevent="handleLogout">
          <i class="ph ph-sign-out me-2"></i>Logout
        </a>
      </li>
    </ul>
  </li>

  <!-- Otherwise, show the Login link that opens the modal -->
  <li v-else-if="allowRegistration" class="nav-item">
    <!-- UPDATED: This now calls the action from your authStore -->
    <a class="nav-link" href="#" @click.prevent="authStore.openLoginModal()">
      <i class="ph ph-sign-in me-1"></i>Login</a>
  </li>
</template>

<script setup>
import { useAuthStore } from '@/store/authStore';
import { RouterLink, useRouter } from 'vue-router';

defineProps({
  allowRegistration: {
    type: Boolean,
    default: false
  }
});

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
.dropdown-item i {
  vertical-align: middle;
}
.nav-link {
    cursor: pointer;
}
</style>
