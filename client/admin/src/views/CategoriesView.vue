<!-- File: src/views/CategoriesView.vue -->
<template>
  <div>
    <!-- Category List -->
    <div class="card shadow-sm">
       <div class="p-3">
          <div class="d-flex justify-content-between align-items-center ">
            <div class="card-title h5 mb-0">Categories <small>({{ categories.length }})</small></div>
            <button @click="openAddModal" class="btn btn-primary btn-sm ms-auto"><i class="ph-duotone ph-plus me-2"></i>Add New Category</button>
          </div>
      </div>
      <div class="card-body">
        <div v-if="categories.length === 0" class="text-center text-muted py-5">
          No categories found. Click the button above to add one!
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-3">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category._id">
                <td>{{ category.name }}</td>
                <td>{{ category.description }}</td>
                <td class="text-end"><button @click="deleteCategory(category._id)" class="btn btn-sm btn-outline-danger border-0"><i class="ph-duotone ph-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Category Form Modal -->
    <div class="modal fade" id="categoryModal" tabindex="-1" aria-labelledby="categoryModalLabel" aria-hidden="true" ref="categoryModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="categoryModalLabel">Add New Category</h5>
            <button type="button" class="btn-close" @click="cancel" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFormSubmit">
              <div class="mb-3">
                <label for="name" class="form-label">Category Name</label>
                <input type="text" v-model="categoryForm.name" id="name" required class="form-control" />
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description (Optional)</label>
                <textarea v-model="categoryForm.description" id="description" rows="3" class="form-control"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancel">Close</button>
            <button type="button" class="btn btn-primary" @click="handleFormSubmit">Save Category</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';

const { addNotification } = useNotifier();
const categories = ref([]);
const categoryModalRef = ref(null);
let categoryModal = null;

const categoryForm = reactive({
  name: '',
  description: ''
});

const fetchCategories = async () => {
  try {
    categories.value = await apiClient('/categories');
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const handleFormSubmit = async () => {
  try {
    await apiClient('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryForm)
    });
    addNotification('Category created successfully!', 'success');
    await fetchCategories();
    categoryModal.hide();
  } catch (error) {
    // Notifier is handled by apiClient
  }
};

const deleteCategory = async (id) => {
  if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) return;
  try {
    await apiClient(`/categories/${id}`, { method: 'DELETE' });
    addNotification('Category deleted.', 'info');
    await fetchCategories();
  } catch (error) {
    // Notifier is handled by apiClient
  }
};

const resetForm = () => {
  categoryForm.name = '';
  categoryForm.description = '';
};

const openAddModal = () => {
  resetForm();
  categoryModal.show();
};

const cancel = () => {
  categoryModal.hide();
};

onMounted(() => {
  fetchCategories();
  if (categoryModalRef.value) {
    categoryModal = new window.bootstrap.Modal(categoryModalRef.value);
    categoryModalRef.value.addEventListener('hidden.bs.modal', resetForm);
  }
});

onUnmounted(() => {
  if (categoryModal) {
    categoryModal.dispose();
  }
});
</script>
