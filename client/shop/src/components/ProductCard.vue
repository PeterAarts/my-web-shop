<!-- FILE: src/components/ProductCard.vue -->
<template>
  <div class="card h-100 shadow-sm border-0">
    <RouterLink :to="{ name: 'productDetail', params: { id: product._id } }">
      <img 
        v-if="product.images && product.images.length > 0"
        :src="getImageUrl(product.images[0].path)" 
        class="card-img-top" 
        :alt="product.images[0].text || product.name"
        style="height: 200px; object-fit: cover;"
      >
      <img 
        v-else
        src="https://placehold.co/600x400/EEE/31343C?text=No+Image"
        class="card-img-top"
        alt="No image available"
        style="height: 200px; object-fit: cover;"
      >
    </RouterLink>
    <div class="card-body d-flex flex-column">
      <h5 class="card-title">{{ product.name }}</h5>
      
      <!-- UPDATED: Using a computed property for safe truncation -->
      <p class="card-text text-muted small flex-grow-1">{{ truncatedDescription }}</p>
      <span class="mb-2 badge " :class="product.stockQuantity > 0 ? 'text-success' : 'text-danger'">
        {{ product.stockQuantity > 0 ? '': 'sorry no longer available' }}
      </span>
      <!-- Conditional Dimensions & Weight on a single line -->
      <div v-if="settings.showProductDimensions && (hasDimensions || hasWeight)" class="mb-3 small text-muted d-flex flex-wrap align-items-center">
        <span v-if="hasDimensions" class="me-2">
          <i class="ph ph-ruler me-1"></i>
          {{ product.dimensions.length }} x {{ product.dimensions.width }} x {{ product.dimensions.height }} cm
        </span>
        <span v-if="hasWeight">
          <i class="ph ph-scalpel me-1"></i>
          {{ product.weight }}g
        </span>
      </div>

      <div class="d-flex justify-content-between align-items-center mt-auto">
        <p class="text-primary fw-bold fs-5 mb-0">€{{ product.price.toFixed(2) }}</p>
        <RouterLink :to="{ name: 'productDetail', params: { id: product._id } }" class="btn btn-sm btn-primary">
          View Details
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  settings: {
    type: Object,
    required: true,
    default: () => ({})
  }
});

// ADDED: Computed property to safely strip HTML and truncate the description
const truncatedDescription = computed(() => {
  if (!props.product.description) return '';
  // First, strip all HTML tags to get plain text
  const plainText = props.product.description.replace(/<[^>]+>/g, '');
  // Then, truncate the plain text if it's longer than 100 characters
  if (plainText.length > 100) {
    return plainText.substring(0, 100) + '...';
  }
  return plainText;
});

const getImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return 'https://placehold.co/600x400/EEE/31343C?text=No+Image';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) {
    return trimmedPath;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
};

const hasDimensions = computed(() => {
    const d = props.product.dimensions;
    return d && d.length > 0 && d.width > 0 && d.height > 0;
});

const hasWeight = computed(() => {
    return props.product.weight > 0;
});
</script>

<style scoped>
.card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
  border:1px solid var(--bs-primary);
}
.card-title {
  font-size: 1rem;
  font-weight: 600;
}
/* REMOVED: The old .product-description CSS is no longer needed */
</style>
