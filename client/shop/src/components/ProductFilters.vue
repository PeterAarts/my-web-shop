<!-- FILE: src/components/ProductFilters.vue -->
<template>
  <!-- The card and card-body divs have been removed for a more subtle look -->
  <div class="row g-2 align-items-center mb-4 bg-light pb-2 px-2 rounded">
    <!-- Search Input (Conditional) -->
    <div v-if="showSearch" class="col-lg-3 col-md-12">
      <div class="input-group input-group-sm">
        <span class="input-group-text"><i class="ph ph-magnifying-glass"></i></span>
        <input 
          type="text" 
          class="form-control" 
          placeholder="Search..."
          :value="filters.searchTerm"
          @input="$emit('update:filters', { ...filters, searchTerm: $event.target.value })">
      </div>
    </div>

    <!-- Category Filter -->
    <div class="col-lg-2 col-md-4">
      <select 
        class="form-select form-select-sm"
        :value="filters.category"
        @change="$emit('update:filters', { ...filters, category: $event.target.value })">
        <option value="">All Categories</option>
        <option v-for="category in categories" :key="category._id" :value="category.name">
          {{ category.name }}
        </option>
      </select>
    </div>

    <!-- Price Range Filter -->
    <div class="col-lg-3 col-md-5">
      <div class="input-group input-group-sm">
        <span class="input-group-text">€</span>
        <input 
          type="number" 
          class="form-control" 
          placeholder="Min"
          :value="filters.priceMin"
          @input="$emit('update:filters', { ...filters, priceMin: $event.target.value ? parseFloat($event.target.value) : null })">
        <span class="input-group-text">-</span>
        <input 
          type="number" 
          class="form-control" 
          placeholder="Max"
          :value="filters.priceMax"
          @input="$emit('update:filters', { ...filters, priceMax: $event.target.value ? parseFloat($event.target.value) : null })">
      </div>
    </div>
    
    <!-- Sorting Options (Conditional) -->
    <div v-if="showSort" class="col-lg-3 col-md-3 ms-auto">
      <div class="input-group input-group-sm">
        <span class="input-group-text bg-light border-0">Sort by:</span>
        <select 
          class="form-select form-select-sm"
          :value="sort"
          @change="$emit('update:sort', $event.target.value)">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-asc">Price (Low-High)</option>
          <option value="price-desc">Price (High-Low)</option>
          <option value="category-asc">Category (A-Z)</option>
          <option value="weight-asc">Weight (Light-Heavy)</option>
        </select>
      </div>
    </div>

    <!-- Clear Button -->
    <div class="col-lg-1 col-md-12 text-end">
      <button class="btn btn-sm btn-outline-primary text-muted border-0" @click="clearFilters">Clear</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: { type: Array, required: true },
  filters: { type: Object, required: true },
  sort: { type: String, required: true },
  showSearch: { type: Boolean, default: false },
  showSort: { type: Boolean, default: false },
});

const emit = defineEmits(['update:filters', 'update:sort']);

const clearFilters = () => {
  emit('update:filters', {
    searchTerm: '',
    category: '',
    priceMin: null,
    priceMax: null,
  });
};
</script>

<style scoped>


</style>
