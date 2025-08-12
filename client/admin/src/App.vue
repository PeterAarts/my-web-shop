<template>
  <RouterView />
</template>
<script setup>
  import { RouterView } from 'vue-router'
  /**
 * Toggles the Bootstrap color theme (light/dark) and saves it to localStorage.
 */
function toggleTheme() {
  // Get the current theme from the <html> element, default to 'light'
  const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';

  // Determine the new theme
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  // Set the new theme on the <html> element
  document.documentElement.setAttribute('data-bs-theme', newTheme);

  // Save the user's preference to localStorage
  localStorage.setItem('theme', newTheme);
}

/**
 * Loads the saved theme from localStorage when the page loads.
 */
function applyStoredTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    document.documentElement.setAttribute('data-bs-theme', storedTheme);
  }
}

// Apply the stored theme as soon as the JS loads
applyStoredTheme();
</script>