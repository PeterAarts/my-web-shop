<!-- FILE: src/views/ShopView.vue -->
<template>
  <div class="p-4">
    <h1 class="mb-4">Shop Our Products</h1>

    <!-- Loading and Error States -->
    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading Products...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    
    <div v-else>
      <!-- Product Filters (Conditional) -->
      <ProductFilters 
        v-if="settings.showProductFilter"
        :categories="categories" 
        :filters="filters"
        :sort="sortOption"
        @update:filters="updateFilters"
        @update:sort="newSort => sortOption = newSort"
        :show-search="settings.showProductSearch"
        :show-sort="settings.showProductSort"
      />

      <!-- Product Grid -->
      <div v-if="paginatedProducts.length > 0" class="row g-4" :class="productGridClass">
        <div v-for="product in paginatedProducts" :key="product._id" class="col">
          <ProductCard :product="product" :settings="settings" />
        </div>
      </div>
      <div v-else class="text-center text-muted py-5 bg-light rounded">
        <h2>No products found</h2>
        <p>Try adjusting your search or filter criteria.</p>
      </div>

      <!-- Pagination Controls (Conditional) -->
      <Pagination
        v-if="settings.showProductPagination && totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @update:current-page="newPage => currentPage = newPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import ProductCard from '@/components/ProductCard.vue';
import ProductFilters from '@/components/ProductFilters.vue';
import Pagination from '@/components/Pagination.vue';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const allProducts = ref([]);
const categories = ref([]);
const settings = ref({});
const loading = ref(true);
const error = ref(null);
const currentPage = ref(1);

const filters = reactive({
  searchTerm: '',
  category: '',
  priceMin: null,
  priceMax: null,
});

const sortOption = ref('name-asc');

const updateFilters = (newFilters) => {
  Object.assign(filters, newFilters);
};

// CORRECTED: Computed property for dynamic product grid classes
const productGridClass = computed(() => {
  const perRow = settings.value.productsPerRow || 3;
  // The row-cols-lg-* class directly takes the number of columns.
  // e.g., if perRow is 2, the class will be 'row-cols-lg-2' for 2 columns.
  return `row-cols-1 row-cols-sm-2 row-cols-lg-${perRow}`;
});

const filteredAndSortedProducts = computed(() => {
  let products = allProducts.value;

  // Filter Logic
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      (p.tags && p.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }
  if (filters.category) {
    products = products.filter(p => p.category === filters.category);
  }
  if (filters.priceMin !== null && filters.priceMin >= 0) {
    products = products.filter(p => p.price >= filters.priceMin);
  }
  if (filters.priceMax !== null && filters.priceMax > 0) {
    products = products.filter(p => p.price <= filters.priceMax);
  }

  // Sorting Logic
  const sorted = [...products];
  const [key, direction] = sortOption.value.split('-');
  sorted.sort((a, b) => {
    const valA = a[key] || 0;
    const valB = b[key] || 0;
    if (key === 'name' || key === 'category') {
      return direction === 'asc' 
        ? (a[key] || '').localeCompare(b[key] || '') 
        : (b[key] || '').localeCompare(a[key] || '');
    } else {
      return direction === 'asc' ? valA - valB : valB - valA;
    }
  });

  return sorted;
});

const totalPages = computed(() => {
  if (!settings.value.rowsPerPage || settings.value.rowsPerPage === 0) {
    return 1;
  }
  const itemsPerPage = settings.value.productsPerRow * settings.value.rowsPerPage;
  if (itemsPerPage <= 0) return 1;
  return Math.ceil(filteredAndSortedProducts.value.length / itemsPerPage);
});

const paginatedProducts = computed(() => {
  if (!settings.value.showProductPagination || !settings.value.rowsPerPage || settings.value.rowsPerPage === 0) {
    return filteredAndSortedProducts.value;
  }
  const itemsPerPage = settings.value.productsPerRow * settings.value.rowsPerPage;
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredAndSortedProducts.value.slice(startIndex, endIndex);
});

watch([() => filters.searchTerm, () => filters.category, () => filters.priceMin, () => filters.priceMax, sortOption], () => {
  currentPage.value = 1;
});

onMounted(async () => {
  try {
    const [productRes, categoryRes, settingsRes] = await Promise.all([
      fetch(`${apiUrl}/products`),
      fetch(`${apiUrl}/categories`),
      fetch(`${apiUrl}/settings`),
    ]);

    if (!productRes.ok) throw new Error('Could not load products.');
    if (!categoryRes.ok) throw new Error('Could not load categories.');
    if (!settingsRes.ok) throw new Error('Could not load shop settings.');

    allProducts.value = await productRes.json();
    categories.value = await categoryRes.json();
    settings.value = await settingsRes.json();

  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>
