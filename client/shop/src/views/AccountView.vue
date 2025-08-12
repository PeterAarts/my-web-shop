<template>
  <div class="">
    <div class="card-title h3 mb-4">My Shop</div>
    <div class="row">
      <div class="col-md-3">
        <div class="list-group">
          <a href="#" class="list-group-item list-group-item-action" :class="{ active: activeTab === 'orders' }" @click.prevent="activeTab = 'orders'">
            <i class="ph ph-receipt me-2"></i>My Orders
          </a>
          <a href="#" class="list-group-item list-group-item-action" :class="{ active: activeTab === 'profile' }" @click.prevent="activeTab = 'profile'">
            <i class="ph ph-user me-2"></i>My Profile
          </a>
          <a href="#" class="list-group-item list-group-item-action" :class="{ active: activeTab === 'security' }" @click.prevent="activeTab = 'security'">
            <i class="ph ph-lock me-2"></i>Security
          </a>
        </div>
      </div>
      <div class="col-md-9">
        <div class="card">
          <div class="card-body">
            <div v-if="loading" class="text-center text-muted">
              <div class="spinner-border spinner-border-sm" role="status"></div>
              <p class="mt-2">Loading...</p>
            </div>

            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <div v-if="activeTab === 'orders' && !loading">
              <h4 class="card-title mb-4">Order History</h4>
              <div class="row mb-3">
                <div class="col-md-2 col-6">
                  <input type="text" class="form-control" placeholder="Search " v-model="searchTerm">
                </div>
              </div>

              <div v-if="paginatedOrders.length === 0" class="text-muted text-center py-5 bg-light rounded">
                <p class="mb-0">You have not placed any orders yet, or none match your search.</p>
              </div>
              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Order #</th>
                      <th class="text-center">Items</th>
                      <th>Status</th>
                      <th class="text-end">Amount</th>
                      <th class="text-center">Downloads</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in paginatedOrders" :key="order._id">
                      <td>{{ new Date(order.createdAt).toLocaleDateString() }}</td>
                      <td>{{ order.orderNumber }}</td>
                      <td class="text-center">{{ getTotalItems(order) }}</td>
                      <td><span class="badge" :class="getStatusClass(order.status)">{{ order.status }}</span></td>
                      <td class="text-end"><strong>€{{ order.totalAmount.toFixed(2) }}</strong></td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-outline-secondary border-0" disabled title="PDF download coming soon">
                          <i class="ph ph-download-simple"></i>
                        </button>
                      </td>
                      <td class="text-center">
                        <button v-if="order.status === 'pending payment'" 
                                class="btn btn-sm btn-outline-danger" 
                                @click="cancelOrder(order)">
                          Cancel
                        </button>
                        <span v-else>-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <nav v-if="totalPages > 1" class="d-flex justify-content-between align-items-center mt-4">
                <div>
                  <label for="itemsPerPage" class="form-label me-2 small">Items per page:</label>
                  <select v-model.number="itemsPerPage" id="itemsPerPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                  </select>
                </div>
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <a class="page-link" href="#" @click.prevent="currentPage--">Previous</a>
                  </li>
                  <li class="page-item disabled"><span class="page-link">Page {{ currentPage }} of {{ totalPages }}</span></li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <a class="page-link" href="#" @click.prevent="currentPage++">Next</a>
                  </li>
                </ul>
              </nav>
            </div>

            <div v-if="activeTab === 'profile' && !loading">
              <h4 class="card-title mb-4">Profile Settings</h4>
              <form @submit.prevent="updateProfile">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" :value="authStore.user?.email" id="email" class="form-control" disabled>
                  </div>
                  <div class="col-md-6">
                    <label for="username" class="form-label">Username</label>
                    <input type="text" v-model="profileForm.username" id="username" class="form-control">
                  </div>
                </div>
                <div class="form-check my-3">
                  <input type="checkbox" v-model="profileForm.newsletterSubscribed" id="newsletter" class="form-check-input">
                  <label for="newsletter" class="form-check-label">Receive newsletter</label>
                </div>
                
                <hr class="my-4">
                <h5 class="mb-3">Saved Shipping Address</h5>
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Street</label>
                    <input type="text" v-model="profileForm.shippingAddress.street" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">City</label>
                    <input type="text" v-model="profileForm.shippingAddress.city" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Postal Code</label>
                    <input type="text" v-model="profileForm.shippingAddress.postalCode" class="form-control">
                  </div>
                  <div class="col-md-12">
                    <label class="form-label">Country Code</label>
                    <input type="text" v-model="profileForm.shippingAddress.countryCode" class="form-control" placeholder="e.g., NL, BE, DE">
                  </div>
                </div>

                <button type="submit" class="btn btn-primary mt-4" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm"></span>
                  Save Changes
                </button>
              </form>
            </div>

            <div v-if="activeTab === 'security' && !loading">
              <h4 class="card-title mb-4">Change Password</h4>
              <form @submit.prevent="changePassword" class="col-6">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label">Current Password</label>
                  <input type="password" v-model="passwordForm.currentPassword" id="currentPassword" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label for="newPassword" class="form-label">New Password</label>
                  <div class="input-group">
                    <input :type="showNewPassword ? 'text' : 'password'" v-model="passwordForm.newPassword" id="newPassword" class="form-control" required>
                    <button class="btn btn-primary" type="button" @click="showNewPassword = !showNewPassword">
                      <i class="ph" :class="showNewPassword ? 'ph-eye-slash' : 'ph-eye'"></i>
                    </button>
                  </div>
                </div>
                <button type="submit" class="btn btn-primary" :disabled="isSaving">
                  <span v-if="isSaving" class="spinner-border spinner-border-sm"></span>
                  Update Password
                </button>
              </form>
              <hr class="my-4">
              <h5 class="card-title mb-4">Delete my Account</h5>
              <div class="p-3 bg-danger-subtle border border-danger-subtle rounded">
                
                <p>Deleting your account is a permanent action and will remove all your data, including order history.</p>
                <button @click="deleteAccount" class="btn btn-danger" :disabled="isSaving">Delete My Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { useConfirm } from '@/composables/useConfirm';
import apiClient from '@/utils/apiClient';

const authStore = useAuthStore();
const confirm = useConfirm();

const activeTab = ref('orders');
const allOrders = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const error = ref('');
const successMessage = ref('');

const searchTerm = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showNewPassword = ref(false);

const profileForm = reactive({
  username: authStore.user?.username || '',
  newsletterSubscribed: authStore.user?.newsletterSubscribed || false,
  shippingAddress: {
    street: authStore.user?.shippingAddress?.street || '',
    city: authStore.user?.shippingAddress?.city || '',
    postalCode: authStore.user?.shippingAddress?.postalCode || '',
    countryCode: authStore.user?.shippingAddress?.countryCode || '',
  }
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
});

const filteredOrders = computed(() => {
  if (!searchTerm.value) return allOrders.value;
  const term = searchTerm.value.toLowerCase();
  return allOrders.value.filter(order =>
    order.orderNumber.toLowerCase().includes(term) ||
    order.items.some(item => item.name.toLowerCase().includes(term))
  );
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage.value));

const paginatedOrders = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredOrders.value.slice(startIndex, endIndex);
});

watch(searchTerm, () => { currentPage.value = 1; });

const showMessage = (msg, type = 'success', duration = 3000) => {
    if (type === 'success') successMessage.value = msg;
    else error.value = msg;
    setTimeout(() => { successMessage.value = ''; error.value = ''; }, duration);
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    allOrders.value = await apiClient('/orders/my-orders');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status) => {
  const map = {
    shipped: 'bg-success', processing: 'bg-info', cancelled: 'bg-danger',
    'pending payment': 'bg-warning text-dark', 'ready for shipment': 'bg-primary',
    received: 'bg-secondary',
  };
  return map[status] || 'bg-light text-dark';
};

const getTotalItems = (order) => {
  if (!order || !order.items) return 0;
  return order.items.reduce((total, item) => total + item.quantity, 0);
};

const updateProfile = async () => {
  isSaving.value = true;
  try {
    await authStore.updateProfile(profileForm); 
    showMessage('Profile updated successfully!');
  } catch (err) {
    showMessage(err.message, 'error');
  } finally {
    isSaving.value = false;
  }
};

const changePassword = async () => {
    isSaving.value = true;
    try {
        await authStore.changePassword(passwordForm);
        showMessage('Password changed successfully!');
        passwordForm.currentPassword = '';
        passwordForm.newPassword = '';
        showNewPassword.value = false;
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        isSaving.value = false;
    }
};

const deleteAccount = async () => {
  const confirmed = await confirm({
    title: 'Delete Account',
    message: 'Are you absolutely sure...? This action is permanent.',
    confirmButtonText: 'Yes, Delete My Account'
  });
  if (confirmed) {
    isSaving.value = true;
    try {
        await authStore.deleteAccount();
    } catch (err) {
        showMessage(err.message, 'error');
    } finally {
        isSaving.value = false;
    }
  }
};
const cancelOrder = async (order) => {
  const confirmed = await confirm({
    title: 'Confirm Cancellation',
    message: `Are you sure you want to cancel order ${order.orderNumber}?`,
    confirmButtonText: 'Yes, Cancel Order'
  });
  if (confirmed) {
    try {
      await apiClient(`/orders/${order._id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
      showMessage('Order successfully cancelled.');
      await fetchOrders();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  }
};

onMounted(() => {
  if (activeTab.value === 'orders') {
    fetchOrders();
  } else {
    loading.value = false;
  }
});

watch(activeTab, (newTab) => {
    if (newTab === 'orders' && allOrders.value.length === 0) {
        fetchOrders();
    }
});
</script>