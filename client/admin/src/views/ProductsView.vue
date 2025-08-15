<template>
  <div>
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-else class="card shadow-sm">
       <div class="p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div class="card-title h5 mb-0 me-auto">Products <small>({{ filteredProducts.length }})</small></div>

        <div class="input-group input-group-sm" style="width: 300px;">
          <span class="input-group-text" id="basic-addon1"><i class="ph-duotone ph-magnifying-glass"></i></span>
          <input type="text" v-model="searchTerm" class="form-control" placeholder="Search by product name...">
        </div>

        <div class="col-md-2">
            <select v-model="activeFilter" class="form-select form-select-sm">
                <option value="all">Show All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
            </select>
        </div>

        <div>
          <button @click="openImportModal" class="btn btn-sm btn-outline-secondary me-2"><i class="ph-duotone ph-upload-simple me-2"></i>Import</button>
          <button @click="openAddModal" class="btn btn-sm btn-primary"><i class="ph-duotone ph-plus me-2"></i>Add Product</button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="filteredProducts.length === 0" class="text-center text-muted py-5">
          No products found matching the current criteria.
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>sku</th>
                <th>Status</th>
                <th>Stock</th>
                <th class="text-end">Price</th>
                <th class="text-end">Weight</th>
                <th>Dimensions</th>
                <th>Expires</th>
                <th>Images</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in paginatedProducts" :key="product._id">
                <td>{{ product.name }}</td>
                <td>{{ product.sku }}</td>
                <td><span class="badge" :class="product.active ? 'bg-success-subtle text-success-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">{{ product.active ? 'Visible' : 'Hidden' }}</span></td>
                <td>{{ product.stockQuantity }}</td>
                <td class="text-end">€{{ product.price.toFixed(2) }}</td>
                <td class="text-end">{{ product.weight }}g</td>
                <td>{{ product.dimensions.length ? `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}cm` : '-' }}</td>
                <td>{{ product.expiresAt ? new Date(product.expiresAt).toLocaleDateString() : '-' }}</td>
                <td>              
                  <div v-if="product.images && product.images.length > 0" class="d-flex" style="gap: 0.5rem;">
                    <img v-for="image in product.images.slice(0, 10)" :key="image.path" :src="getImageUrl(image.path)" class="rounded border" style="width: 36px; height: 36px; object-fit: cover;" :title="image.text" alt="Product Thumbnail">
                  </div>
                </td>
                <td class="text-end">
                  <button @click="selectProductForEdit(product)" class="btn btn-sm btn-outline-secondary border-0 me-2"><i class="ph-duotone ph-pencil-simple"></i></button>
                  <button @click="confirmDelete(product)" class="btn btn-sm btn-outline-danger border-0"><i class="ph-duotone ph-trash"></i></button> 
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="totalPages > 1" class="d-flex justify-content-between align-items-center p-3">
        <div>
          <label for="itemsPerPage" class="form-label me-2 small">Items per page:</label>
          <select v-model.number="itemsPerPage" id="itemsPerPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option :value="products.length">All</option>
          </select>
        </div>
        <nav>
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="currentPage--">Previous</a>
            </li>
            <li class="page-item disabled">
              <span class="page-link">Page {{ currentPage }} of {{ totalPages }}</span>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="currentPage++">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true" ref="productModalRef">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="productModalLabel">{{ formTitle }}</h5>
            <button type="button" class="btn-close" @click="cancelEdit" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFormSubmit">
              <div class="row g-3">
                <div class="col-8">
                  <label for="name" class="form-label">Product Name</label>
                  <input type="text" v-model="productForm.name" id="name" required class="form-control" />
                </div>
                <div class="col-md-4" v-if="settings && settings.productSettings">
                  <label for="productSku" class="form-label">SKU</label>
                  <input 
                    type="text" 
                    v-model="productForm.sku" 
                    id="productSku" 
                    class="form-control"
                    :disabled="settings.productSettings.skuGeneration === 'automatic' && !isEditing"
                    :placeholder="settings.productSettings.skuGeneration === 'automatic' && !isEditing ? 'Generated automatically' : 'Enter SKU'"
                  >
                </div>
                <div class="col-4">
                  <div class="form-check form-switch pt-2">
                    <input class="form-check-input " type="checkbox" role="switch" id="productActive" v-model="productForm.active">
                    <label class="form-check-label" for="productActive">Product is active and visible in the shop</label>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <div ref="quillEditorRef" style="height: 150px;"></div>
                </div>
                <div class="col-md-3">
                  <label for="price" class="form-label">Price (€)</label>
                  <input type="number" v-model.number="productForm.price" id="price" step="0.01" required class="form-control" />
                </div>
                <div class="col-md-3">
                  <label for="stock" class="form-label">Stock Quantity</label>
                  <input type="number" v-model.number="productForm.stockQuantity" id="stock" required class="form-control" />
                </div>
                <div class="col-md-3">
                  <label for="category" class="form-label">Category</label>
                  <select v-model="productForm.category" id="category" class="form-select">
                    <option :value="null">-- No Category --</option>
                    <option v-for="cat in categories" :key="cat._id" :value="cat.name">{{ cat.name }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label for="expiresAt" class="form-label">Expiration Date (Optional)</label>
                  <input type="date" v-model="productForm.expiresAt" id="expiresAt" class="form-control" />
                </div>

                <div v-if="settings.enableStockLimit" class="col-md-2">
                  <label for="stockLimit" class="form-label">Stock Limit per Order</label>
                  <input type="number" v-model.number="productForm.stockLimit" id="stockLimit" class="form-control" />
                   <div class="form-text">Set to 0 for no limit.</div>
                </div>
                <div class="col-md-3">
                  <label for="weight" class="form-label">Weight (grams)</label>
                  <input type="number" v-model.number="productForm.weight" id="weight" step="0.01" required class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Dimensions (cm) (l x w x h)</label>
                  <div class="input-group">
                    <input type="number" v-model.number="productForm.dimensions.length" placeholder="L" required class="form-control" />
                    <input type="number" v-model.number="productForm.dimensions.width" placeholder="W" required class="form-control" />
                    <input type="number" v-model.number="productForm.dimensions.height" placeholder="H" required class="form-control" />
                  </div>
                </div>
                 <div class="col-md-6">
                  <label for="tags" class="form-label">Tags</label>
                  <input type="text" v-model="tagsInput" id="tags" class="form-control" placeholder="e.g. vintage, paper, christmas" />
                  <div class="form-text">Enter tags separated by commas.</div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-body border-top pt-3">
              <p class="form-label mb-2">Product Images</p>
              <button type="button" class="btn btn-sm btn-outline-secondary mb-3" @click="requestProductImage">
                <i class="ph-duotone ph-images-square me-2"></i>Select or Upload Image
              </button>
             <div v-if="productForm.images && productForm.images.length > 0" class="image-scroller">
                <div v-for="(image, index) in productForm.images" :key="index" class="image-thumbnail-wrapper">
                  <div class="position-relative">
                    <img :src="getImageUrl(image.path)" class="rounded border" />
                    <button @click.prevent="removeImage(index)" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" style="line-height: 1; padding: 0.1rem 0.3rem;">&times;</button>
                  </div>
                  <input type="text" v-model="image.text" class="form-control form-control-sm mt-2" placeholder="Optional caption...">
                </div>
             </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelEdit">Close</button>
            <button type="button" class="btn btn-primary" @click="handleFormSubmit">{{ submitButtonText }}</button>
          </div>
        </div>
      </div>
    </div>

    <ProductImportModal ref="importModalRef" @import-complete="fetchProducts" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, nextTick, watch } from 'vue'
import ProductImportModal from '@/components/ProductImportModal.vue';
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';
import eventBus from '@/utils/eventBus'; 
import { showConfirmation, addNotification } from '@/composables/useNotifier';

// ---  Added a loading state ---
const loading = ref(true);

const products = ref([]);
const categories = ref([]);
const tagsInput = ref('');

//  Initialize settings with a safe default structure
const settings = ref({
  productSettings: {
    skuGeneration: 'manual'
  }
});

const activeFilter = ref('all');
const searchTerm = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const productForm = reactive({
  _id: null, name: '', description: '', price: 0, stockQuantity: 0,
  stockLimit: 0, category: null, tags: [], weight: 0, sku:'',
  dimensions: { length: 0, width: 0, height: 0 },
  images: [], expiresAt: null, active: true,
});

const isEditing = ref(false);
const productModalRef = ref(null);
const importModalRef = ref(null);
const quillEditorRef = ref(null);
let quillInstance = null;

const formTitle = computed(() => isEditing.value ? 'Edit Product' : 'Add a New Product');
const submitButtonText = computed(() => isEditing.value ? 'Update Product' : 'Save Product');

const filteredProducts = computed(() => {
  let filtered = products.value;
  if (activeFilter.value === 'active') {
    filtered = filtered.filter(p => p.active);
  } else if (activeFilter.value === 'inactive') {
    filtered = filtered.filter(p => !p.active);
  }
  if (searchTerm.value) {
    const lowerCaseSearch = searchTerm.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(lowerCaseSearch)
    );
  }
  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value));

const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredProducts.value.slice(startIndex, endIndex);
});

watch([filteredProducts, itemsPerPage], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1;
  }
});

const getImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
};

const initializeQuill = () => {
  if (quillEditorRef.value && !quillInstance) {
    quillInstance = new Quill(quillEditorRef.value, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] }
    });
  }
};

const fetchProducts = () => apiClient('/products');
const fetchCategories = () => apiClient('/categories');
const fetchSettings = () => apiClient('/settings');

const handleFormSubmit = async () => {
  if (quillInstance) productForm.description = quillInstance.root.innerHTML;
  productForm.tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
  
  const promise = isEditing.value ? updateProduct() : createProduct();
  try {
    await promise;
    window.bootstrap.Modal.getInstance(productModalRef.value)?.hide();
  } catch (error) {
    // Error is handled by apiClient
  }
};

const createProduct = async () => {
  await apiClient('/products', { method: 'POST', body: productForm });
  await fetchProductsAndUpdateState();
};

const updateProduct = async () => {
  await apiClient(`/products/${productForm._id}`, { method: 'PUT', body: productForm });
  await fetchProductsAndUpdateState();
};

const fetchProductsAndUpdateState = async () => {
  try {
    products.value = await fetchProducts();
  } catch (error) {
    console.error('Error refetching products:', error);
  }
};

const confirmDelete = async (product) => {
  const confirmed = await showConfirmation({
    title: 'Confirm Deletion',
    message: `Are you sure you want to delete : <br><br><b>${product.name}</b> ?`,
    alertType: 'danger' 
  });

  if (confirmed) {
    try {
      await apiClient(`/products/${product._id}`, { method: 'DELETE' });
      await fetchProductsAndUpdateState();
    } 
    catch (error) { /* Handled by apiClient */ }
  }
};

// MODIFIED: Renamed from onProductImageSelected
const requestProductImage = () => {
  eventBus.emit('open-image-picker', (imagePath) => {
    if (!productForm.images) productForm.images = [];
    productForm.images.push({ path: imagePath, text: '' });
  });
};

const removeImage = (index) => {
  productForm.images.splice(index, 1);
};

const openAddModal = async () => {
  resetForm();
  isEditing.value = false;
  window.bootstrap.Modal.getOrCreateInstance(productModalRef.value).show();
  await nextTick();
  initializeQuill();
  if (quillInstance) quillInstance.root.innerHTML = '';
};

const openImportModal = () => {
  importModalRef.value?.open();
};

const selectProductForEdit = async (product) => {
  resetForm();
  isEditing.value = true;
  const productCopy = JSON.parse(JSON.stringify(product));
  Object.assign(productForm, productCopy);
  tagsInput.value = productCopy.tags ? productCopy.tags.join(', ') : '';
  productForm.expiresAt = productCopy.expiresAt ? new Date(productCopy.expiresAt).toISOString().split('T')[0] : null;
  
  window.bootstrap.Modal.getOrCreateInstance(productModalRef.value).show();
  
  await nextTick();
  initializeQuill();
  if (quillInstance) quillInstance.root.innerHTML = product.description;
};

const resetForm = () => {
  // isEditing is set in the functions that open the modal
  Object.assign(productForm, {
    _id: null, name: '', description: '', price: 0, stockQuantity: 0,
    stockLimit: 0, category: null, tags: [], weight: 0, sku: '',
    dimensions: { length: 0, width: 0, height: 0 },
    images: [], expiresAt: null, active: true,
  });
  tagsInput.value = '';
  if (quillInstance) quillInstance.root.innerHTML = '';
};

const cancelEdit = () => {
  window.bootstrap.Modal.getInstance(productModalRef.value)?.hide();
};

onMounted(async () => {
  try {
    // MODIFIED: Fetch all initial data concurrently and wait for it
    const [productsData, categoriesData, settingsData] = await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchSettings()
    ]);
    products.value = productsData;
    categories.value = categoriesData;
    // Safely assign settings, ensuring productSettings exists
    if (settingsData && !settingsData.productSettings) {
      settingsData.productSettings = { skuGeneration: 'manual' };
    }
    settings.value = settingsData;
  } catch (error) {
    addNotification('Failed to load initial page data.', 'failure');
    console.error('Initialization error:', error);
  } finally {
    loading.value = false; // Set loading to false after all data is fetched
  }

  if (productModalRef.value) {
    productModalRef.value.addEventListener('hidden.bs.modal', () => {
      resetForm();
      if (quillInstance) {
        const toolbar = quillEditorRef.value.previousElementSibling;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
          toolbar.remove();
        }
        quillInstance = null;
      }
    });
  }
});
</script>

<style scoped>
.image-scroller {
  display: flex;
  overflow-x: auto;
  padding-bottom: 1rem;
  gap: 1rem;
}
.image-thumbnail-wrapper {
  flex: 0 0 auto;
  width: 120px;
}
.image-thumbnail-wrapper img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}
.table th {
  font-weight: 600;
}
</style>