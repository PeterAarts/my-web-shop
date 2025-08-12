<script setup>
import { onMounted, computed, watchEffect } from 'vue';
import { RouterView } from 'vue-router';
import { useThemeStore } from '@/store/themeStore';
import { useCartStore } from '@/store/cartStore'; // NEW: Import the cart store

const themeStore = useThemeStore();
const themeCss = computed(() => themeStore.dynamicThemeCss);

watchEffect(() => {
  // This will print the generated CSS to your browser's console.
  //console.log("Generated dynamic CSS:", themeCss.value);

  let styleTag = document.getElementById('dynamic-theme-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme-styles';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = themeCss.value;
});


onMounted(async () => {
  // NEW: Initialize the cart store and fetch the cart from the server
  const cartStore = useCartStore();
  //cartStore.fetchCart();
  cartStore.init();

  // Your existing onMounted logic for themes remains the same
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/settings`);
    if (!response.ok) throw new Error('Network response was not ok');
    const settings = await response.json();
    if (settings && settings.shopTitle) {
      document.title = settings.shopTitle;
    }
    themeStore.setTheme(settings);
  } catch (error) {
    console.error("Failed to fetch and apply dynamic theme:", error);
  }
});
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>