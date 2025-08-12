<script setup>
import { ref } from 'vue';
import { RouterView } from 'vue-router';

// 1. Create a simple, hardcoded style object.
// We are NOT using Pinia or fetching data for this test.
const testStyles = ref({
  '--bs-primary': 'blue',
  '--bs-primary-rgb': '0, 0, 255',
  '--bs-secondary': 'orange',
  '--bs-secondary-rgb': '255, 165, 0',

  // Override button variables directly
  '--bs-btn-bg': 'blue',
  '--bs-btn-border-color': 'blue',
  '--bs-btn-hover-bg': 'darkblue',
  '--bs-btn-hover-border-color': 'darkblue',
});
</script>

<template>
  <main :style="testStyles">
    <RouterView />
  </main>
</template>