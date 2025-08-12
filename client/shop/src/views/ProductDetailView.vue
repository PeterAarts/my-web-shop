<!-- File: src/views/ProductDetailView.vue -->
<template>
  <div class="">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else-if="!product" class="text-center text-muted py-5">
      <h2>Product not found</h2>
      <p>Sorry, we couldn't find the product you're looking for.</p>
      <RouterLink to="/shop" class="btn btn-primary">Back to Shop</RouterLink>
    </div>
    <div v-else>
      <!-- Navigation Row -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <RouterLink to="/shop" class="btn btn-outline-primary border-0 fw-bold">
          <i class="ph ph-arrow-left me-2"></i>
          Back to Shop
        </RouterLink>
        <div class="d-flex" style="gap: 1rem;">
          <RouterLink v-if="previousProductId" :to="{ name: 'productDetail', params: { id: previousProductId } }" class="btn btn-outline-primary border-0  ">
            <i class="ph ph-caret-left"></i> Prev
          </RouterLink>
          <RouterLink v-if="nextProductId" :to="{ name: 'productDetail', params: { id: nextProductId } }" class="btn btn-outline-primary border-0">
            Next <i class="ph ph-caret-right"></i>
          </RouterLink>
        </div>
      </div>

      <!-- Product Details Container -->
      <div class="card p-3 p-md-4 rounded shadow-sm text-dark">
        <div class="row g-5">
          <!-- Image Gallery -->
          <div class="col-md-7">
            <div class="row">
              <div class="col-md-9 mb-3">
                <img :src="getImageUrl(activeImage)" class="img-fluid rounded" alt="Main product image">
              </div>
              <div v-if="product.images && product.images.length > 1" class="flex flex-column col-md-3" style="gap: 0.5rem; max-width: 100%;">
                <img v-for="image in product.images" :key="image.path" 
                    :src="getImageUrl(image.path)" 
                    class="img-thumbnail m-1" 
                    style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;"
                    :class="{ 'border-primary border-2': activeImage === image.path }"
                    @click="activeImage = image.path"
                    alt="Product thumbnail">
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div class="col-md-5  ms-auto d-flex flex-column">
            <h2>{{ product.name }}</h2>
            <div class="d-flex my-2">
              <div class="text-muted mb-4 me-auto">
                <span class="badge" :class="product.stockQuantity > 0 ? 'bg-success' : 'bg-danger'">
                  {{ product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock' }}
                </span>
              </div>
              <div class="h1 d-flex text-primary fw-bold  ms-auto ">€ {{ product.price.toFixed(2) }}</div>
            </div>
            <div class="mb-4">
              <div v-html="product.description" class="product-description-full"></div>
            </div>

            <div v-if="settings.showProductDimensions && (hasDimensions || hasWeight)" class="mb-4">
                <div class="card-title border-bottom pb-2">Specifications</div>
                <div class="d-flex flex-wrap align-items-center mt-3 text-muted">
                    <span v-if="hasDimensions" class="me-3">
                        <i class="ph ph-ruler text-primary me-1"></i>
                        {{ product.dimensions.length }} x {{ product.dimensions.width }} x {{ product.dimensions.height }} cm
                    </span>
                    <span v-if="hasWeight"> 
                        <i class="ph ph-scales mx-1 text-primary"></i>
                        {{ product.weight }}g
                    </span>
                </div>
            </div>

            <!-- Add to Cart Section -->
            <div v-if="settings.showProductAddToCart">
              <div v-if="product.stockQuantity > 0">
                <div class="d-flex g-2 align-items-center">
                  <div class="col-md-3">
                    <label for="quantity" class="form-label">Quantity</label>
                    <input type="number" v-model.number="quantity" id="quantity" class="form-control" :max="maxQuantity" min="1">
                  </div>
                  <div class="d-flex ms-auto">
                    <button @click="handleAddToCart" class="btn btn-primary  mt-4" :disabled="isAddingToCart">
                      <span v-if="isAddingToCart" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <i v-else class="ph ph-shopping-cart-simple me-2"></i>
                      {{ isAddingToCart ? 'Adding...' : 'Add to Cart' }}
                    </button>
                  </div>
                </div>
                <div v-if="message" :class="`alert mt-3 ${messageType === 'success' ? 'alert-success' : 'alert-danger'}`" role="alert">
                  {{ message }}
                </div>
              </div>
              <div v-else>
                <button class="btn btn-secondary btn-lg w-100" disabled>Out of Stock</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- REPLACED: General Shop Remark is now the dynamic StoryList component -->
      <div class="mt-5">
        <StoryList 
          v-if="productPageStories.length > 0"
          :stories="productPageStories"
          title="notes"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { allProducts } from '../store/products';
import { useCartStore } from '@/store/cartStore.js';
import StoryList from '@/components/StoryList.vue'; 

const cartStore = useCartStore();
const route = useRoute();
const product = ref(null);
const settings = ref({});
const productPageStories = ref([]);
const loading = ref(true);
const activeImage = ref('');
const quantity = ref(1);
const message = ref('');
const messageType = ref('success');
const isAddingToCart = ref(false);
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const handleAddToCart = async () => {
  if (!product.value) return;
  isAddingToCart.value = true;
  message.value = '';
  try {
    await cartStore.addToCart(product.value, quantity.value);
    product.value.stockQuantity -= quantity.value;
    message.value = `${quantity.value} x "${product.value.name}" added to cart!`;
    messageType.value = 'success';
  } catch (error) {
    message.value = error.message;
    messageType.value = 'danger';
  } finally {
    isAddingToCart.value = false;
    setTimeout(() => {
      message.value = '';
    }, 3000);
  }
};

const maxQuantity = computed(() => {
  if (!product.value) return 1;
  if (settings.value.enableStockLimit && product.value.stockLimit > 0) {
    return Math.min(product.value.stockQuantity, product.value.stockLimit);
  }
  return product.value.stockQuantity;
});

const hasDimensions = computed(() => {
    if (!product.value || !product.value.dimensions) return false;
    const d = product.value.dimensions;
    return d.length > 0 && d.width > 0 && d.height > 0;
});

const hasWeight = computed(() => {
    return product.value && product.value.weight > 0;
});

const getImageUrl = (filePath) => {
  if (!filePath || typeof filePath !== 'string') return '';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
}

const fetchProductAndSettings = async (productId) => {
  loading.value = true;
  quantity.value = 1;
  productPageStories.value = [];
  try {
    const [productRes, settingsRes, storiesRes] = await Promise.all([
      fetch(`${apiUrl}/products/${productId}`),
      fetch(`${apiUrl}/settings`),
      // CORRECTED: Use the correct slug for the API call
      fetch(`${apiUrl}/stories/location/productdetail-page`)
    ]);

    if (!productRes.ok) throw new Error('Product not found');
    product.value = await productRes.json();
    if (product.value.images && product.value.images.length > 0) {
      activeImage.value = product.value.images[0].path;
    }

    if (settingsRes.ok) {
      settings.value = await settingsRes.json();
    }
    
    if (storiesRes.ok) {
      productPageStories.value = await storiesRes.json();
    }

  } catch (error) {
    console.error("Error fetching data:", error);
    product.value = null;
  } finally {
    loading.value = false;
  }
};

const currentProductIndex = computed(() => {
  if (!product.value || allProducts.value.length === 0) return -1;
  return allProducts.value.findIndex(p => p._id === product.value._id);
});

const previousProductId = computed(() => {
  if (currentProductIndex.value > 0) {
    return allProducts.value[currentProductIndex.value - 1]._id;
  }
  return null;
});

const nextProductId = computed(() => {
  if (currentProductIndex.value > -1 && currentProductIndex.value < allProducts.value.length - 1) {
    return allProducts.value[currentProductIndex.value + 1]._id;
  }
  return null;
});

watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProductAndSettings(newId);
  }
}, { immediate: true });

watch(quantity, (newVal) => {
  if (newVal > maxQuantity.value) {
    quantity.value = maxQuantity.value;
  }
  if (newVal < 1) {
    quantity.value = 1;
  }
});
</script>

<style>
.product-description-full p { margin-bottom: 1rem; }
.product-description-full ul, .product-description-full ol { padding-left: 1.5rem; }
</style>
