<!-- FILE: src/components/Pagination.vue -->
<template>
  <nav aria-label="Page navigation" class="d-flex justify-content-center mt-5">
    <ul class="pagination">
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Previous</a>
      </li>
      <li class="page-item disabled">
        <span class="page-link text-muted">Page {{ currentPage }} of {{ totalPages }}</span>
      </li>
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['update:currentPage']);

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= props.totalPages) {
    emit('update:currentPage', newPage);
  }
};
</script>

<style scoped>
.page-link {
  color: #9D9DCC;
}
.page-item.active .page-link {
  background-color: #9D9DCC;
  border-color: #9D9DCC;
}
.page-item.disabled .page-link {
    color: #6c757d;
    background-color: #fff;
    border-color: #dee2e6;
}
</style>
