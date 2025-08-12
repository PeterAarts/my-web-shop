<!-- FILE: src/views/admin/SettingsView.vue -->
<template>
  <div>
    <div class="card">
      <div class="p-3">
        <!-- Tab Navigation -->
        <ul class="nav nav-tabs p-3-tabs">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'general' }" href="#" @click.prevent="activeTab = 'general'">General</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'layout' }" href="#" @click.prevent="activeTab = 'layout'">Layout</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'product' }" href="#" @click.prevent="activeTab = 'product'">Product</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'shipping' }" href="#" @click.prevent="activeTab = 'shipping'">Shipping</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'payments' }" href="#" @click.prevent="activeTab = 'payments'">Payments</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'orders' }" href="#" @click.prevent="activeTab = 'orders'">Orders</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'theme' }" href="#" @click.prevent="activeTab = 'theme'">Theme Colors</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: activeTab === 'media' }" href="#" @click.prevent="activeTab = 'media'">Media & Social</a>
          </li>
          <li class="d-flex ms-auto">
            <button @click="saveAllSettings" class="btn btn-primary btn-sm"><i class="ph-duotone ph-floppy-disk me-2"></i>Save All Settings</button>
          </li>
        </ul>
        
      </div>
      <div class="card-body">
        <form @submit.prevent="saveAllSettings">
          <!-- General Settings Tab -->
          <div v-show="activeTab === 'general'">
            <h5 class="card-title mb-3">General Information</h5>
            <div class="row g-3">
              <div class="col-md-4">
                <label for="shopTitle" class="form-label">Shop Title</label>
                <input type="text" v-model="settingsForm.shopTitle" id="shopTitle" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="shopSubtitle" class="form-label">Shop Subtitle</label>
                <input type="text" v-model="settingsForm.shopSubtitle" id="shopSubtitle" class="form-control" />
              </div>
              <div class="col-md-4">
                <label for="footerText" class="form-label">Footer Text</label>
                <input type="text" v-model="settingsForm.footerText" id="footerText" class="form-control" />
              </div>
              <div class="col-12">
                <label class="form-label">General Shop Remark</label>
                <div ref="quillEditorRef" style="height: 250px;"></div>
              </div>

            </div>
            <hr class="my-4">
            <h5 class="card-title mb-4">Shop Sender Address</h5>
            <div class="row g-3">
               <div class="col-md-3">
                  <label for="shopName" class="form-label">Sender Name</label>
                  <input type="text" v-model="settingsForm.shopAddress.name" id="shopName" class="form-control">
                </div>
                <div class="col-md-3">
                  <label for="shopStreet" class="form-label">Street & Number</label>
                  <input type="text" v-model="settingsForm.shopAddress.street" id="shopStreet" class="form-control">
                </div>
                <div class="col-md-3">
                  <label for="shopCity" class="form-label">City</label>
                  <input type="text" v-model="settingsForm.shopAddress.city" id="shopCity" class="form-control">
                </div>
                <div class="col-md-2">
                  <label for="shopZip" class="form-label">Postal Code</label>
                  <input type="text" v-model="settingsForm.shopAddress.zipCode" id="shopZip" class="form-control">
                </div>
                <div class="col-md-1">
                  <label for="shopCountry" class="form-label">Country Code</label>
                  <input type="text" v-model="settingsForm.shopAddress.countryCode" id="shopCountry" class="form-control" placeholder="e.g., NL">
                </div>
            </div>
          </div>

          <!-- Layout Tab -->
          <div v-show="activeTab === 'layout'">
             <h5 class="card-title mb-3">Layout Settings</h5>
            <div class="row g-3">
              <div class="col-md-2">
                <label class="form-label">Page Layout</label>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pageLayout" id="layoutContained" value="contained" v-model="settingsForm.pageLayout">
                  <label class="form-check-label" for="layoutContained">Contained</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="pageLayout" id="layoutFullWidth" value="full-width" v-model="settingsForm.pageLayout">
                  <label class="form-check-label" for="layoutFullWidth">Full Width</label>
                </div>
              </div>
              <div class="col-md-3">
                <label for="contentMaxWidth" class="form-label">Content Max Width (px)</label>
                <input type="number" v-model.number="settingsForm.contentMaxWidth" id="contentMaxWidth" class="form-control" :disabled="settingsForm.pageLayout === 'full-width'" />
                <div class="form-text">Applies only when "Contained" layout is selected.</div>
              </div>
              <div class="col-md-3">
                <label for="productsPerRow" class="form-label">Products per Row</label>
                <select v-model.number="settingsForm.productsPerRow" id="productsPerRow" class="form-select">
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
              <div class="col-md-3">
                <label for="rowsPerPage" class="form-label">Rows per Page</label>
                <input type="number" v-model.number="settingsForm.rowsPerPage" id="rowsPerPage" class="form-control" />
                <div class="form-text">Set to 0 for no limit (disables pagination).</div>
              </div>
            </div>
            <hr class="my-4">
            <h5 class="card-title mb-3">Product Display Options</h5>
            <div class="row g-3">
              <div class="col-md-4" v-for="option in displayOptions" :key="option.key">
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" :id="option.key" v-model="settingsForm[option.key]">
                  <label class="form-check-label" :for="option.key">{{ option.label }}</label>
                </div>
              </div>
            </div>
          </div>        
          <!-- Product Tab -->
          <div v-show="activeTab === 'product'">
            <div class="row g-3">
              <div class="col-md-4">
                <h5 class="card-title mb-3">Product Features</h5>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="enableStockLimit" v-model="settingsForm.enableStockLimit">
                  <label class="form-check-label" for="enableStockLimit">Enable purchase limits per product</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="hideOutOfStock" v-model="settingsForm.hideOutOfStockProducts">
                  <label class="form-check-label" for="hideOutOfStock">Hide out-of-stock products from the shop</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" role="switch" id="hideExpired" v-model="settingsForm.hideExpiredProducts">
                  <label class="form-check-label" for="hideExpired">Hide expired products from the shop</label>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card-title h5">SKU Generation</div>
                <div class="card-body" v-if="settingsForm.productSettings">
                  <div class="mb-3">
                    <label class="form-label">Strategy</label>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="skuManual" value="manual" v-model="settingsForm.productSettings.skuGeneration">
                      <label class="form-check-label" for="skuManual">Manual (Enter SKU for each new product)</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="radio" id="skuAuto" value="automatic" v-model="settingsForm.productSettings.skuGeneration">
                      <label class="form-check-label" for="skuAuto">Automatic (Generate sequential SKUs)</label>
                    </div>
                  </div>
                  <div v-if="settingsForm.productSettings.skuGeneration === 'automatic'">
                    <div class="row">
                      <div class="col-md-6">
                        <label for="skuPrefix" class="form-label">SKU Prefix</label>
                        <input type="text" id="skuPrefix" v-model="settingsForm.productSettings.skuPrefix" class="form-control" placeholder="e.g., ITEM-">
                      </div>
                      <div class="col-md-6">
                        <label for="skuNextNumber" class="form-label">Next SKU Number</label>
                        <input type="number" id="skuNextNumber" v-model.number="settingsForm.productSettings.skuNextNumber" class="form-control">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- Shipping Tab Pane -->
          <div v-show="activeTab === 'shipping'">
            <!-- ... shipping tab content is unchanged ... -->
          </div>

          <!-- Payments Tab -->
          <div v-show="activeTab === 'payments'">
            <h5 class="card-title mb-4">Configured Payment Providers</h5>
            <div v-if="loading.payments" class="text-center">
              <div class="spinner-border" role="status"></div>
            </div>
            <div v-else class="table-responsive">
              <!-- NEW: Table Layout -->
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Requires Registration</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="provider in paymentProviders" :key="provider._id">
                    <td><strong>{{ provider.name }}</strong></td>
                    <td>
                      <span class="badge" :class="provider.isOnline ? 'bg-info-subtle text-info-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
                        {{ provider.isOnline ? 'Online' : 'Offline' }}
                      </span>
                    </td>
                    <td>
                      <span v-if="provider.isOnline" class="badge" :class="provider.mode === 'live' ? 'bg-success' : 'bg-warning'">
                        {{ provider.mode }}
                      </span>
                      <span v-else class="text-muted small">—</span>
                    </td>
                    <td>
                      <span class="badge" :class="provider.isEnabled ? 'bg-success' : 'bg-secondary'">
                        {{ provider.isEnabled ? 'Enabled' : 'Disabled' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="provider.requiresRegistration ? 'bg-primary' : 'bg-light text-dark'">
                        {{ provider.requiresRegistration ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <button @click.prevent="openEditPaymentModal(provider)" class="btn btn-sm btn-outline-secondary">
                        <i class="ph-duotone ph-pencil me-2"></i>Edit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- NEW: Edit Payment Provider Modal -->
            <div class="modal fade" ref="editPaymentProviderRef" tabindex="-1" aria-hidden="true">
              <div class="modal-dialog modal-lg">
                <div class="modal-content" v-if="editPaymentProviderData">
                  <div class="modal-header">
                    <h5 class="modal-title">Edit {{ editPaymentProviderData.name }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    <form @submit.prevent="saveEditedPaymentProvider">
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" role="switch" v-model="editPaymentProviderData.isEnabled">
                        <label class="form-check-label">Enable {{ editPaymentProviderData.name }}</label>
                      </div>
                      <div class="form-check form-switch mb-4">
                        <input class="form-check-input" type="checkbox" role="switch" v-model="editPaymentProviderData.requiresRegistration">
                        <label class="form-check-label">Requires user to be registered</label>
                      </div>

                      <div v-if="editPaymentProviderData.isOnline">
                        <div class="row">
                          <div class="mb-3 col-md-4">
                            <label class="form-label">Mode</label>
                            <select class="form-select" v-model="editPaymentProviderData.mode">
                              <option value="sandbox">Sandbox</option>
                              <option value="live">Live</option>
                            </select>
                          </div>
                          <div class="mb-3 col-md-8">
                            <label class="form-label">Client ID</label>
                            <input type="text" class="form-control" v-model="editPaymentProviderData.credentials.clientId">
                          </div>
                          <div class="mb-3 col-12">
                            <label class="form-label">Client Secret</label>
                            <input type="password" class="form-control" v-model="editPaymentProviderData.credentials.clientSecret" placeholder="••••••••••••••">
                            <small class="form-text text-muted">Leave blank to keep existing secret.</small>
                          </div>
                        </div>
                      </div>

                      <div v-else>
                        <div class="mb-3">
                          <label class="form-label">Payment Instructions</label>
                          <textarea class="form-control" rows="6" v-model="editPaymentProviderData.instructions"></textarea>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" @click="saveEditedPaymentProvider">Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          <!-- Orders Tab -->
          <div v-show="activeTab === 'orders'">
            <!-- ... orders tab content is unchanged ... -->
          </div>
          <!-- Theme Colors Tab -->
          <div v-show="activeTab === 'theme'">
            <!-- ... theme tab content is unchanged ... -->
          </div>

          <!-- Media & Social Tab -->
          <div v-show="activeTab === 'media'">
            <!-- ... media tab content is unchanged ... -->
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref, nextTick, watch } from 'vue';
import ImagePicker from '@/components/ImagePicker.vue';
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';
import { Modal } from 'bootstrap'; // Import Modal

const { addNotification } = useNotifier();
const activeTab = ref('general');
const activeShippingTab = ref('packages');
const quillEditorRef = ref(null);
let quillInstance = null;

const loading = reactive({
  settings: true,
  shipping: true,
  payments: true,
});

const shippingProviders = ref([]);
const paymentProviders = ref([]); 
const availableOrderStatuses = ref(['created', 'received', 'processing', 'ready for shipment', 'pending payment', 'shipped', 'cancelled']);

// NEW: State for the Payment Provider Edit Modal
const editPaymentProviderRef = ref(null);
const editPaymentProviderData = ref(null);
let editPaymentProviderModalInstance = null;

const displayOptions = ref([
  { key: 'showProductDescription', label: 'Show Description' },
  { key: 'showProductPrice', label: 'Show Price' },
  { key: 'showProductImage', label: 'Show Image' },
  { key: 'showProductAddToCart', label: 'Show "Add to Cart"' },
  { key: 'showProductCategory', label: 'Show Category' },
  { key: 'showProductTags', label: 'Show Tags' },
  { key: 'showProductRating', label: 'Show Rating' },
  { key: 'showProductStock', label: 'Show Stock' },
  { key: 'showProductDimensions', label: 'Show Product Dimensions' },
  { key: 'showProductReviews', label: 'Show Reviews' },
  { key: 'showProductSearch', label: 'Show Search Bar' },
  { key: 'showProductFilter', label: 'Show Filters' },
  { key: 'showProductSort', label: 'Show Sorting Options' },
  { key: 'showProductPagination', label: 'Show Pagination' },
  { key: 'allowShopRegistration', label: 'Allow Shop Registration' }
]);

const settingsForm = reactive({
  _id: null,
  shopTitle: '',
  shopSubtitle: '',
  headerImageUrl: '',
  faviconUrl: '',
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  shopRemark: '',
  footerText: '',
  productsPerRow: 4,
  rowsPerPage: 0,
  enableStockLimit: false,
  hideExpiredProducts: true,
  hideOutOfStockProducts: true,
  allowShopRegistration: true,
  pageLayout: 'contained',
  contentMaxWidth: 1300,
  siteBackgroundColor: '#f8f9fa',
  siteTextColor: '#212529',
  primaryColor: '#9D9DCC',
  cardBackgroundColor: '#ffffff',
  productBackgroundColor: '#ffffff',
  archiveOrdersDays: 30,
  archiveOrdersStatuses: ['shipped', 'cancelled'],
  shopAddress: { name: '', street: '', city: '', zipCode: '', countryCode: '' },
  shippingPackages: [],
  productSettings: {
    skuGeneration: 'manual',
    skuPrefix: 'ITEM-',
    skuNextNumber: 10001,
  },
  ...Object.fromEntries(displayOptions.value.map(opt => [opt.key, true]))
});

const newProviderForm = reactive({
  name: '',
  providerKey: '',
  apiUrl: '',
  isEnabled: true,
  credentials: { apiKey: '' }
});

const removePackage = (index) => {
  settingsForm.shippingPackages.splice(index, 1);
};

const initializeQuill = () => {
  if (quillEditorRef.value && !quillInstance) {
    quillInstance = new Quill(quillEditorRef.value, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['clean']] }
    });
    quillInstance.root.innerHTML = settingsForm.shopRemark;
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'general') {
    nextTick(() => initializeQuill());
  }
});

const getImageUrl = (filePath) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${filePath}`;
};

const fetchSettings = async () => {
  loading.settings = true;
  try {
    const data = await apiClient('/settings');
    if (data) {
      // Use Object.assign for a cleaner merge of fetched data
      Object.assign(settingsForm, data);
      // This ensures that if productSettings doesn't exist in the fetched data,
      // it gets initialized with default values, preventing errors.
      if (!settingsForm.productSettings) {
        settingsForm.productSettings = {
          skuGeneration: 'manual',
          skuPrefix: 'ITEM-',
          skuNextNumber: 10001,
        };
      }
      // --- END ADDED BLOCK ---
    }
    if (activeTab.value === 'general') {
        await nextTick();
        initializeQuill();
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
  } finally {
    loading.settings = false;
  }
};

const fetchShippingProviders = async () => {
  loading.shipping = true;
  try {
    const providersData = await apiClient('/shipping-providers');
    shippingProviders.value = providersData.map(p => ({
      ...p,
      rateCardString: JSON.stringify(p.rateCard || {}, null, 2)
    }));
  } catch (error) {
    console.error('Failed to fetch shipping providers:', error);
  } finally {
    loading.shipping = false;
  }
};

const onHeaderImageSelected = (imagePath) => {
  settingsForm.headerImageUrl = imagePath;
};
const onFaviconSelected = (imagePath) => {
  settingsForm.faviconUrl = imagePath;
};

const saveAllSettings = async () => {
  if (quillInstance) {
    settingsForm.shopRemark = quillInstance.root.innerHTML;
  }
  try {
    const response = await apiClient('/settings', {
      method: 'PUT',
      body: settingsForm
    });
    addNotification(response.msg || 'Settings saved successfully.', 'success');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const saveShippingProvider = async (provider) => {
  const providerToSave = { ...provider };
  try {
    providerToSave.rateCard = JSON.parse(providerToSave.rateCardString);
  } catch (e) {
    addNotification('The rate card contains invalid JSON. Please correct it.', 'failure');
    return;
  }
  delete providerToSave.rateCardString;
  try {
    await apiClient(`/shipping-providers/${provider._id}`, {
      method: 'PUT',
      body: providerToSave
    });
     addNotification(`${provider.name} has been updated.`, 'success');
  } catch (error) {
    console.error('Failed to save shipping provider:', error);
  }
};

const addNewProvider = async () => {
  try {
    const newProvider = await apiClient('/shipping-providers', {
      method: 'POST',
      body: newProviderForm
    });
    shippingProviders.value.push({
      ...newProvider,
      rateCardString: JSON.stringify(newProvider.rateCard || {}, null, 2)
    });
    Object.assign(newProviderForm, {
      name: '',
      providerKey: '',
      apiUrl: '',
      isEnabled: true,
      credentials: { apiKey: '' }
    });
  } catch (error) {
    console.error('Failed to add new shipping provider:', error);
  }
};

const editPackageModalRef = ref(null);
const editPackageData = ref(null);
const editPackageIndex = ref(null);
let editPackageModalInstance = null;

const openEditPackageModal = (pkg, index) => {
  editPackageData.value = { ...pkg };
  editPackageIndex.value = index;
  if (!editPackageModalInstance) {
    editPackageModalInstance = new window.bootstrap.Modal(editPackageModalRef.value);
  }
  editPackageModalInstance.show();
};
const saveEditedPackage = () => {
  if (editPackageData.value) {
    if (editPackageIndex.value === null) {
      settingsForm.shippingPackages.push({ ...editPackageData.value });
    } else {
      settingsForm.shippingPackages[editPackageIndex.value] = { ...editPackageData.value };
    }
    editPackageModalInstance.hide();
  }
};
const addPackage = () => {
  editPackageData.value = {
    name: '',
    length: 10,
    width: 10,
    height: 10,
    maxWeight: 1000
  };
  editPackageIndex.value = null;
  if (!editPackageModalInstance) {
    editPackageModalInstance = new window.bootstrap.Modal(editPackageModalRef.value);
  }
  editPackageModalInstance.show();
};

const fetchPaymentProviders = async () => {
  loading.payments = true;
  try {
    const data = await apiClient('/payment-providers');
    paymentProviders.value = data.map(p => ({
      ...p,
      credentials: p.credentials || { clientId: '', clientSecret: '' }
    }));
  } catch (error) {
    console.error('Failed to fetch payment providers:', error);
  } finally {
    loading.payments = false;
  }
};

// NEW: Function to open the edit modal
const openEditPaymentModal = (provider) => {
  // Create a deep copy to avoid mutating the original data until save
  editPaymentProviderData.value = JSON.parse(JSON.stringify(provider));
  if (!editPaymentProviderModalInstance) {
    editPaymentProviderModalInstance = new Modal(editPaymentProviderRef.value);
  }
  editPaymentProviderModalInstance.show();
};

// RENAMED & MODIFIED: This function now saves the data from the modal
const saveEditedPaymentProvider = async () => {
  if (!editPaymentProviderData.value) return;

  const provider = editPaymentProviderData.value;
  const payload = {
    isEnabled: provider.isEnabled,
    requiresRegistration: provider.requiresRegistration,
    mode: provider.mode,
    instructions: provider.instructions,
    credentials: { clientId: provider.credentials.clientId }
  };
  
  // Only include the secret if the user has entered a new one
  if (provider.credentials.clientSecret) {
    payload.credentials.clientSecret = provider.credentials.clientSecret;
  }

  try {
    const response = await apiClient(`/payment-providers/${provider._id}`, {
      method: 'PUT',
      body: payload
    });
    addNotification(response.msg || `${provider.name} has been updated.`, 'success');
    editPaymentProviderModalInstance.hide();
    await fetchPaymentProviders(); // Refresh the list with updated data
  } catch (error) {
    console.error('Failed to save payment provider:', error);
  }
};

onMounted(() => {
  fetchSettings();
  fetchShippingProviders();
  fetchPaymentProviders();
});
</script>
