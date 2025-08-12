// File: src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainLayout from '../layouts/MainLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import ProductsView from '../views/ProductsView.vue'
import StoriesView from '../views/StoriesView.vue'
import OrdersView from '../views/OrdersView.vue'
import CategoriesView from '../views/CategoriesView.vue' 
import UsersView from '../views/UsersView.vue'
import SettingsView from '../views/SettingsView.vue' 
import ImageManagerView from '../views/ImageManagerView.vue';
import EmailTemplates from '../views/emailTemplates.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login',name: 'login',component: LoginView},
    { path: '/',component: MainLayout,meta: { requiresAuth: true },
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'products', name: 'products', component: ProductsView },
        { path: 'categories', name: 'categories', component: CategoriesView },
        { path: 'stories', name: 'stories', component: StoriesView },
        { path: 'orders', name: 'orders', component: OrdersView },
        { path: 'users',name: 'users', component: UsersView},
        { path: 'images',name: 'images', component: ImageManagerView,meta: { requiresAdmin: true }},
        { path: 'settings', name: 'settings', component: SettingsView },
        { path: 'email-templates',name: 'email-templates', component: EmailTemplates, meta: { requiresAuth: true, requiresAdmin: true } }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router
