<template>
  <div class="p-4">
    <section v-if="mainStory" class="mb-5">
      <div class="overflow-hidden" style="background-color: #f0f0f8;">
        <div class="row g-0">
          <div class="col-md-3 p-4">
            <img v-if="mainStory.image" :src="getStoryImageUrl(mainStory.image.path)" class="w-100 h-100 rounded" :alt="mainStory.image.text || mainStory.title" style="object-fit: cover;">
          </div>
          <div class="col-md-9">
            <div class="p-4 ">
              <div v-html="mainStory.content" class=""></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-5">
      <RouterLink to="/shop" class="text-decoration-none text-dark">
        <h4 class="mb-4">Latest Products</h4>
      </RouterLink>
      <div v-if="loading" class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="products.length === 0" class="text-center text-muted">
        <p>No products found at the moment. Please check back later!</p>
      </div>
      <div v-else class="row row-cols-1 row-cols-sm-2 g-4" :class="gridClass">
        <div v-for="product in products" :key="product._id" class="col">
          <ProductCard :product="product" :settings="settings" />
        </div>
      </div>
    </section>

    <StoryList :stories="otherStories" title="stories" />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import ProductCard from '../components/ProductCard.vue';
import StoryList from '../components/StoryList.vue'; 

defineProps({
  settings: {
    type: Object,
    required: true
  }
});
// --- State ---
const products = ref([])
const activeStories = ref([])
const settings = ref({ productsPerRow: 4 });
const loading = ref(true)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// --- Computed properties ---
const mainStory = computed(() => activeStories.value.length > 0 ? activeStories.value[0] : null);
const otherStories = computed(() => activeStories.value.length > 1 ? activeStories.value.slice(1) : []);
const gridClass = computed(() => {
  const cols = settings.value.productsPerRow || 4;
  return `row-cols-md-${cols === 4 ? 3 : cols} row-cols-lg-${cols}`;
});

// --- Helper functions ---
const getStoryImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
}

// --- Data fetching ---
const fetchHomePageData = async () => {
  loading.value = true;
  try {
    const [storiesRes, productsRes, settingsRes] = await Promise.all([
      fetch(`${apiUrl}/stories/location/front-page`),
      fetch(`${apiUrl}/products?limit=8`),
      fetch(`${apiUrl}/settings`)
    ]);

    if (!storiesRes.ok) throw new Error('Failed to fetch stories');
    if (!productsRes.ok) throw new Error('Failed to fetch products');
    
    if (settingsRes.ok) {
      settings.value = await settingsRes.json();
    }

    // UPDATED: No more client-side filtering needed
    const frontPageStories = await storiesRes.json();
    const allProducts = await productsRes.json();
    
    // The backend already filters by date, but sorting happens here
    activeStories.value = frontPageStories.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    const productsToShow = settings.value.productsPerRow || 4;
    products.value = allProducts.slice(0, productsToShow);

  } catch (error) {
    console.error("Error fetching homepage data:", error);
  } finally {
    loading.value = false;
  }
}

// --- Lifecycle hooks ---
onMounted(() => {
  fetchHomePageData();
});
</script>