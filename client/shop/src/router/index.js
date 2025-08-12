// FILE: src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

// Import Layouts
import ShopLayout from '@/layouts/ShopLayout.vue';

// Import Views
import HomeView from '@/views/HomeView.vue';
import ShopView from '@/views/ShopView.vue';
import AboutView from '@/views/AboutView.vue';
import ProductDetailView from '@/views/ProductDetailView.vue';
import CartView from '@/views/CartView.vue';
import LoginRegisterView from '@/views/LoginRegisterView.vue';
import AccountView from '@/views/AccountView.vue';
import CheckoutView from '@/views/CheckoutView.vue';
import VerifyEmail from '@/views/VerifyEmail.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- All routes now use the ShopLayout ---
    {
      path: '/',
      component: ShopLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'shop', name: 'shop', component: ShopView },
        { path: 'about', name: 'about', component: AboutView }, 
        { path: 'product/:id', name: 'productDetail', component: ProductDetailView },
        { path: 'cart', name: 'cart', component: CartView },
        { path: 'checkout', name: 'checkout', component: CheckoutView },
        { path: 'verify-email/:token', name: 'VerifyEmail',component: VerifyEmail},
        { path: 'order-confirmation/:id/:token?',name: 'OrderConfirmation',component: () => import('@/views/OrderConfirmationView.vue'),},
        { path: 'reset-password/:token',name: 'ResetPassword',component: () => import('@/views/ResetPasswordView.vue'),},
        { path: 'login',name: 'login',
          component: LoginRegisterView,
          // Prevent logged-in users from seeing the login page
          beforeEnter: (to, from, next) => {
            const authStore = useAuthStore();
            if (authStore.isAuthenticated) {
              next({ name: 'account' }); // Redirect to their account page
            } else {
              next();
            }
          }
        },
        { path: 'account',name: 'account',component: AccountView,meta: { requiresShopAuth: true }},
      ]
    },
  ]
});

// Global Navigation Guard - Simplified for Shop Only
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Shop account protection
  if (to.matched.some(record => record.meta.requiresShopAuth)) {
    if (!authStore.isAuthenticated) {
      next({ name: 'login' }); // Redirect to the shop login page
    } else {
      next();
    }
  } else {
    next(); // Make sure to always call next() for public routes
  }
});

export default router;