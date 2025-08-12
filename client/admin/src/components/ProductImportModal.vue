<!-- File: src/components/ProductImportModal.vue -->
<template>
  <div class="modal fade" id="importModal" tabindex="-1" aria-labelledby="importModalLabel" aria-hidden="true" ref="modalRef">
    <div class="modal-dialog modal-xl">
      <div class="modal-content border-secondary">
        <div class="modal-header border-secondary">
          <h5 class="modal-title" id="importModalLabel">Import Products from CSV</h5>
          <button type="button" class="btn-close btn-close-white" @click="close" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- Step 1: Upload -->
          <div v-if="step === 1">
            <div class="row g-3">
              <div class="col-md-12">
                <label class="form-label"><b>1.</b> Select Import Source</label>
                <div class="flex flex-column" style="gap: 1rem;">
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="importSource" id="sourceEtsy" value="etsy" v-model="importSource">
                    <label class="form-check-label" for="sourceEtsy">Etsy</label>
                  </div>
                  <div class="form-check mt-2">
                    <input class="form-check-input" type="radio" name="importSource" id="sourceShopify" value="shopify" v-model="importSource">
                    <label class="form-check-label" for="sourceShopify">Shopify</label>
                  </div>
                </div>
              </div>
              <div class="col-md-12 mt-4">
                <label for="defaultCategory" class="form-label"><b>2.</b> Assign a Default Category (Optional)</label>
                <select v-model="defaultCategory" id="defaultCategory" class="form-select">
                  <option :value="null">-- No Category --</option>
                  <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
                </select>
              </div>
              <div class="col-12 mt-4">
                <label class="form-label w-100"><b>3.</b> Upload CSV File
                  <p class="text-white-50 small">Upload the CSV file you downloaded from your shop manager.</p>
                </label>
                <input type="file" @change="handleFileChange" accept=".csv" class="form-control" />
                <p v-if="error" class="text-danger mt-3">{{ error }}</p>
              </div>
            </div>
          </div>

          <!-- Step 2: Preview -->
          <div v-if="step === 2">
            <h6 class="mb-3">Product Preview</h6>
            <p class="">Review the products to be imported. Uncheck any you wish to skip.</p>
            <div class="table-responsive" style="max-height: 400px;">
              <table class="table  table-hover">
                <thead>
                  <tr>
                    <th><input type="checkbox" @change="toggleSelectAll" :checked="allSelected" /></th>
                    <th>Title</th>
                    <th>Price (€)</th>
                    <th>Quantity</th>
                    <th>Images</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(product, index) in previewData" :key="index">
                    <td><input type="checkbox" v-model="product.selected" /></td>
                    <td>{{ product.name }}</td>
                    <td>{{ product.price }}</td>
                    <td>{{ product.stockQuantity }}</td>
                    <td>{{ product.images.length }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Step 3: Importing -->
          <div v-if="step === 3">
            <h6 class="mb-3">Importing...</h6>
            <p class="text-white-50">Please wait while the products are being imported...</p>
            <div class="progress" role="progressbar">
              <div class="progress-bar progress-bar-striped progress-bar-animated" :style="{ width: progress + '%' }"></div>
            </div>
            <p class="text-center mt-2">{{ progress.toFixed(0) }}% Complete</p>
          </div>

        </div>
        <div class="modal-footer border-secondary">
          <button type="button" class="btn btn-secondary" @click="close">Close</button>
          <button v-if="step === 1 && file" type="button" class="btn btn-primary" @click="parseCsv">Parse File</button>
          <button v-if="step === 2" type="button" class="btn btn-success" @click="startImport" :disabled="selectedProducts.length === 0">
            Import {{ selectedProducts.length }} Products
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Papa from 'papaparse';
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';

const emit = defineEmits(['import-complete']);
const { addNotification } = useNotifier();

const modalRef = ref(null);
let importModal = null;

const step = ref(1);
const file = ref(null);
const error = ref('');
const previewData = ref([]);
const progress = ref(0);
const importSource = ref('etsy');
const categories = ref([]);
const defaultCategory = ref(null);

const allSelected = computed(() => previewData.value.length > 0 && previewData.value.every(p => p.selected));
const selectedProducts = computed(() => previewData.value.filter(p => p.selected));

const handleFileChange = (event) => {
  file.value = event.target.files[0];
  error.value = '';
};

const fetchCategories = async () => {
  try {
    categories.value = await apiClient('/categories');
  } catch (err) {
    addNotification('Could not load product categories.', 'failure');
  }
};

const parseToNumber = (priceString) => {
  if (typeof priceString !== 'string' || priceString.trim() === '') return 0;
  const sanitizedString = priceString.replace(',', '.');
  return parseFloat(sanitizedString) || 0;
}

const groupShopifyProducts = (rows) => {
  const productMap = new Map();
  for (const row of rows) {
    const handle = row['Handle'];
    if (!handle) continue;
    if (!productMap.has(handle)) {
      if (!row['Title']) continue;
      const priceInEuros = row['Variant Price'];
      const images = row['Image Src'] ? [{ path: row['Image Src'], text: row['Image Alt Text'] || '' }] : [];
      const weightInKg = row['Variant Grams'] ? parseToNumber(row['Variant Grams']) / 1000 : 0;
      
      productMap.set(handle, {
        name: row.Title,
        description: row['Body (HTML)'] || '',
        price: priceInEuros,
        stockQuantity: parseInt(row['Variant Inventory Qty'], 10) || 0,
        images: images,
        weight: weightInKg,
      });
    } else {
      const existingProduct = productMap.get(handle);
      if (row['Image Src'] && !existingProduct.images.some(img => img.path === row['Image Src'])) {
        existingProduct.images.push({ path: row['Image Src'], text: row['Image Alt Text'] || '' });
      }
    }
  }
  return Array.from(productMap.values());
}

const parseCsv = () => {
  if (!file.value) {
    error.value = 'Please select a file to import.';
    return;
  }
  error.value = '';

  Papa.parse(file.value, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      if (results.errors.length) {
        error.value = 'Failed to parse CSV. Please check the file format.';
        addNotification(error.value, 'failure');
        return;
      }
      if (!results.data || results.data.length === 0) {
        error.value = 'No products found in the CSV file.';
        addNotification(error.value, 'info');
        return;
      }

      let mappedData = [];
      if (importSource.value === 'shopify') {
        mappedData = groupShopifyProducts(results.data);
      } else {
        mappedData = results.data.map(row => {
          const images = [];
          for (let i = 1; i <= 10; i++) {
            if (row[`IMAGE${i}`]) images.push({ path: row[`IMAGE${i}`], text: '' });
          }
          return {
            name: row.TITLE,
            description: row.DESCRIPTION || '',
            price: parseToNumber(row.PRICE),
            stockQuantity: parseInt(row.QUANTITY, 10) || 0,
            images: images,
            weight: 0, // Etsy CSV doesn't have weight
          };
        }).filter(p => p.name);
      }

      if (mappedData.length === 0) {
        error.value = `No valid products found for the "${importSource.value}" format.`;
        addNotification(error.value, 'failure');
        return;
      }

      previewData.value = mappedData.map(p => ({ ...p, selected: true }));
      step.value = 2;
    },
  });
};

const startImport = async () => {
  step.value = 3;
  const productsToImport = selectedProducts.value;
  const total = productsToImport.length;
  let successCount = 0;

  for (let i = 0; i < total; i++) {
    const product = productsToImport[i];
    // FIX: Construct a full payload with defaults for all required fields
    const payload = {
      name: product.name,
      description: product.description || 'No description provided.',
      price: product.price || 0,
      stockQuantity: product.stockQuantity || 0,
      images: product.images || [],
      category: defaultCategory.value,
      weight: product.weight || 0,
      dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
      stockLimit: product.stockLimit || 0,
      tags: product.tags || [],
      expiresAt: product.expiresAt || null
    };

    try {
      await apiClient('/products', { method: 'POST', body: JSON.stringify(payload) });
      successCount++;
    } catch (apiError) {
      addNotification(`Failed to import "${product.name}": ${apiError.message}`, 'failure');
    }
    progress.value = ((i + 1) / total) * 100;
  }

  addNotification(`${successCount} of ${total} products imported successfully.`, 'primary');
  emit('import-complete');
  close();
};

const toggleSelectAll = (event) => {
  previewData.value.forEach(p => p.selected = event.target.checked);
};

const resetState = () => {
  step.value = 1;
  file.value = null;
  error.value = '';
  previewData.value = [];
  progress.value = 0;
  importSource.value = 'etsy';
  defaultCategory.value = null;
};

const open = () => {
  fetchCategories();
  importModal?.show();
};
const close = () => importModal?.hide();

defineExpose({ open });

onMounted(() => {
  if (modalRef.value) {
    importModal = new window.bootstrap.Modal(modalRef.value);
    modalRef.value.addEventListener('hidden.bs.modal', resetState);
  }
});

onUnmounted(() => {
  if (modalRef.value) {
    modalRef.value.removeEventListener('hidden.bs.modal', resetState);
  }
  importModal?.dispose();
});
</script>
