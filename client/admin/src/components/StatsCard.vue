<!-- FILE: src/components/StatsCard.vue -->
<template>
  <div class="card shadow-sm border-0 h-100">
    <div class="card-body">
      <div class="d-flex align-items-center">
        <div class="flex-grow-1">
          <h6 class="text-muted text-uppercase fs-7 mb-2">{{ title }}</h6>
          <h3 class="mb-0 fw-bold">{{ value }}</h3>
          <p v-if="description" class="mb-0 small text-muted">{{ description }}</p>
        </div>
        <div v-if="icon" class="flex-shrink-0">
          <div class="d-flex align-items-center justify-content-center rounded-circle bg-light text-primary" style="width: 48px; height: 48px;">
            <i class="fs-4" :class="icon"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});
</script>
