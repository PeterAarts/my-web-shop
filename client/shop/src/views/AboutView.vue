<template>
  <div class="p-4">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else-if="aboutPageStories.length === 0" class="text-center text-muted py-5">
      <h1>About Us</h1>
      <p class="lead">More about our shop and journey will be shared here soon!</p>
    </div>
    
    <StoryList v-else :stories="aboutPageStories" title="Our Story & Updates" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import StoryList from '@/components/StoryList.vue';

const allStories = ref([]);
const loading = ref(true);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetches all stories from the API.
 */
const fetchStories = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${apiUrl}/stories`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    allStories.value = await response.json();
  } catch (error) {
    console.error("Error fetching stories for About page:", error);
    allStories.value = []; // Ensure stories is an empty array on error
  } finally {
    loading.value = false;
  }
};

/**
 * A computed property that filters and sorts stories for the About page.
 * It only includes active stories marked for the 'about-page' location.
 */
const aboutPageStories = computed(() => {
  const now = new Date();
  return allStories.value
    .filter(story => {
      const start = new Date(story.startDate);
      const end = story.endDate ? new Date(story.endDate) : null;
      // Check for the correct displayLocation and if the story is currently active
      return (story.displayLocations || []).includes('about-page') &&
             start <= now &&
             (!end || end >= now);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first
});

/**
 * Fetch stories when the component is mounted.
 */
onMounted(() => {
  fetchStories();
});
</script>

<style scoped>
/* You can add any page-specific styles here if needed */
</style>