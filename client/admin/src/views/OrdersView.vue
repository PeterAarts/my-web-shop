<template>
  <div>
    <div class="card shadow-sm">
      <div class="p-3 d-flex justify-content-between align-items-center flex-wrap">
        <h5 class="card-title mb-0">
          {{ showArchived ? 'Archived Orders' : 'Orders' }}
        </h5>
        <div class="d-flex align-items-center mt-2 mt-md-0" style="gap: 1rem;">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="showArchived" v-model="showArchived">
            <label class="form-check-label" for="showArchived">Show Archived</label>
          </div>
          <button @click="runArchive" class="btn btn-sm btn-outline-secondary" :disabled="isArchiving">
            <span v-if="isArchiving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            <span v-else>Run Archive</span>
          </button>
          <button @click="processSelectedOrders" class="btn btn-sm btn-primary" :disabled="selectedOrders.length === 0 || showArchived">
            Process Selected
          </button>
        </div>
      </div>
      <div class="card-body">
        <OrdersTable
          :orders="orders"
          @edit-order="selectOrderForEdit"
          @selection-changed="updateSelection"
          @create-label="selectOrderForLabel"
          @download-picklist="handleDownloadPickList" 
        />
      </div>
    </div>

    <div class="modal fade" id="orderModal" tabindex="-1" aria-labelledby="orderModalLabel" aria-hidden="true" ref="orderModalRef">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="orderModalLabel">Edit Order #{{ orderForm.orderNumber }}</h5>
            <button type="button" class="btn-close" @click="cancelEdit" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateOrder">
              <div class="row g-3">
                <div class="col-md-4"><label class="form-label">Customer Name</label><input type="text" v-model="orderForm.customerDetails.name" class="form-control" /></div>
                <div class="col-md-4"><label class="form-label">Customer Email</label><input type="email" v-model="orderForm.customerDetails.email" class="form-control" /></div>
                <div class="col-md-4">
                  <label class="form-label">Order Status</label>
                  <select v-model="orderForm.status" class="form-select">
                    <option v-for="status in allowedStatuses" :key="status" :value="status">{{ status }}</option>
                  </select>
                </div>
                <div class="col-12"><label class="form-label">Shipping Address</label><textarea v-model="orderForm.customerDetails.address" rows="1" class="form-control"></textarea></div>
              </div>
            </form>
            <div v-if="orderForm.shippingDetails && orderForm.shippingDetails.shippingMethodName">
                <hr class="mt-4">
                <h6>Shipping Details</h6>
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Method</label>
                        <input type="text" class="form-control" :value="orderForm.shippingDetails.shippingMethodName" disabled />
                    </div>
                    <div class="col-md-1">
                        <label class="form-label">Price in €</label>
                        <input type="text" class="form-control" :value="orderForm.shippingDetails.shippingMethodCost" disabled />
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Tracking #</label>
                        <input type="text" v-model="orderForm.shippingDetails.trackingNumber" class="form-control" placeholder="Enter tracking number" />
                    </div>
                    <div class="col-md-3" v-if="orderForm.shippingDetails.labelUrl">
                        <label class="form-label">Shipping Label</label>
                        <a :href="`${apiBaseUrl}${orderForm.shippingDetails.labelUrl}`" target="_blank" class="btn btn-outline-success w-100">
                            <i class="ph ph-printer me-2"></i>View Label
                        </a>
                    </div>
                </div>
            </div>
            <hr class="mt-4">
            <h6>Payment Details</h6>
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Payment Status</label>
                    <select v-model="orderForm.paymentDetails.paymentStatus" class="form-select text-capitalize">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Payment Date</label>
                    <input type="date" v-model="orderForm.paymentDetails.paymentDate" class="form-control">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Transaction ID</label>
                    <input type="text" v-model="orderForm.paymentDetails.paymentTransactionId" class="form-control" placeholder="e.g., PayPal TXN ID">
                </div>
            </div>
           
            <hr class="my-4">
            <h6>Order Items</h6>
            <ul class="list-group">
              <li v-for="item in orderForm.items" :key="item.productId" class="list-group-item d-flex justify-content-between">
                <span>{{ item.name }} (x{{ item.quantity }})</span>
                <span>€{{ (item.price * item.quantity).toFixed(2) }}</span>
              </li>
            </ul>
            <hr class="my-4">
            <h6>Order History</h6>
            <div v-if="historyLoading" class="text-center">
              <div class="spinner-border spinner-border-sm" role="status"></div>
            </div>
            <div v-else-if="orderHistory.length > 0">
              <div v-for="(logs, date) in groupedHistory" :key="date" class="mb-3">
                <h6 class="border-bottom pb-2 mb-2 text-muted">{{ date }}</h6>
                <div v-for="log in logs" :key="log._id" class="d-flex align-items-start py-1">
                  <span class="fs-4 me-2" style="line-height: 1;">&bull;</span>
                  <span class="text-muted me-3" style="min-width: 70px;">{{ new Date(log.date).toLocaleTimeString() }}</span>
                  <div class="flex-grow-1">
                    <span v-if="log.type === 'status'">
                      Status changed to <span class="badge" :class="getStatusBadgeClass(log.newStatus)">{{ log.newStatus }}</span> by {{ log.changedBy.username }}
                    </span>
                    <span v-if="log.type === 'email'">
                      Email "<strong>{{ log.templateSlug }}</strong>" sent to {{ log.recipient }}
                    </span>
                  </div>
                  <div class="ms-3 text-nowrap">
                    <span v-if="log.type === 'email' && log.status === 'failed'" class="badge bg-danger">Failed</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">No history found for this order.</p>
            </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelEdit">Close</button>
            <button type="button" class="btn btn-primary" @click="updateOrder">Save Changes</button>
          </div>
        </div>
      </div>
    </div>

    <LabelCreationModal
      v-if="orderForLabel"
      :order="orderForLabel"
      @label-created="handleLabelCreated"
      ref="labelModalRef"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'; 
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';
import OrdersTable from '@/components/OrdersTable.vue';
import LabelCreationModal from '@/components/LabelCreationModal.vue';

const { addNotification } = useNotifier();
const orders = ref([]);
const orderForm = reactive({
  _id: null,
  orderNumber: '',
  customerDetails: { name: '', email: '', address: '' },
  items: [],
  status: 'created',
  paymentDetails: {}, 
  shippingDetails: {}
});

const orderModalRef = ref(null);
let orderModal = null;
const allowedStatuses = ['created', 'received', 'processing', 'ready for shipment', 'pending payment', 'shipped', 'cancelled'];
const selectedOrders = ref([]);
const showArchived = ref(false);
const isArchiving = ref(false);

const orderForLabel = ref(null);
const labelModalRef = ref(null);

// --- NEW: State for the Order History feature ---
const orderHistory = ref([]);
const historyLoading = ref(false);

const apiBaseUrl = computed(() => {
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return apiUrl.replace('/api', '');
});

const getStatusBadgeClass = (status) => {
  const map = {
    shipped: 'bg-success',
    processing: 'bg-info',
    cancelled: 'bg-danger',
    rejected: 'bg-danger',
    'pending payment': 'bg-warning text-dark',
    'ready for shipment': 'bg-primary',
    received: 'bg-success',
    created: 'bg-secondary',
    paid: 'bg-success',
  };
  return map[status] || 'bg-light text-dark';
};
const formatErrorMessage = (message) => {
  if (!message) return 'Unknown error.';
  // Extracts the core error message from the EJS output
  const parts = message.split(' ');
  if (parts.includes('is') && parts.includes('not') && parts.includes('defined')) {
    const errorIndex = parts.indexOf('is');
    return parts.slice(errorIndex - 1).join(' ');
  }
  return message;
};
watch(showArchived, () => { fetchOrders(); });

const groupedHistory = computed(() => {
  if (!orderHistory.value || orderHistory.value.length === 0) {
    return {};
  }
  // The .reduce method iterates over the history and groups items into an object
  return orderHistory.value.reduce((groups, log) => {
    const date = new Date(log.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {});
});

const fetchOrders = async () => {
  try {
    orders.value = await apiClient(`/orders?active=${!showArchived.value}`);
  } catch (error) { console.error('Error fetching orders:', error); }
};

// --- MODIFIED: The function to open the edit modal ---
const selectOrderForEdit = async (order) => {
  const orderCopy = JSON.parse(JSON.stringify(order));
  Object.assign(orderForm, orderCopy);
  
  // Clear old history and show modal immediately
  orderHistory.value = [];
  historyLoading.value = true;
  orderModal.show();

  // Fetch the new history in the background
  try {
    orderHistory.value = await apiClient(`/logs/${order._id}`);
  } catch (error) {
    console.error("Failed to fetch order history:", error);
    addNotification('Could not load order history.', 'failure');
  } finally {
    historyLoading.value = false;
  }
};

const updateSelection = (newSelection) => {
  selectedOrders.value = newSelection;
};

const handleDownloadPickList = async (order) => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      addNotification('You must be logged in to download this file.', 'failure');
      return;
    }
    const response = await fetch(`${apiBaseUrl.value}/api/orders/${order._id}/picklist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) { throw new Error('Failed to download the pick list.'); }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PickList-${order.orderNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    addNotification(error.message, 'failure');
  }
};

const selectOrderForLabel = async (order) => {
  orderForLabel.value = order;
  await nextTick();
  labelModalRef.value?.open();
};

const handleLabelCreated = () => {
  addNotification('Shipping label created successfully!', 'success');
  fetchOrders();
  orderForLabel.value = null;
};

const updateOrder = async () => {
  if (!orderForm._id) {
    addNotification('No order selected for update.', 'failure');
    return;
  }
  const payload = {
    status: orderForm.status,
    customerDetails: orderForm.customerDetails,
    paymentDetails: orderForm.paymentDetails,
    shippingDetails: orderForm.shippingDetails
  };
  try {
    await apiClient(`/orders/${orderForm._id}`, {
      method: 'PUT',
      body: payload
    });
    await fetchOrders();
    cancelEdit();
  } catch (error) {
    console.error("Failed to update order:", error);
  }
};

const cancelEdit = () => { orderModal.hide(); };

// Note: getNextStatus was not defined in the provided file, so it has been omitted.
// const getNextStatus = (currentStatus) => { /* ... */ };

const processSelectedOrders = async () => { 
  // This function body was not provided in the original file.
  // Assuming a bulk update might happen here.
  addNotification('Bulk processing not yet implemented.', 'info');
};

const runArchive = async () => { 
  isArchiving.value = true;
  try {
    const result = await apiClient('/orders/archive', { method: 'POST' });
    addNotification(result.msg, 'success');
    await fetchOrders();
  } catch(err) {
    console.error('Archiving failed:', err);
  } finally {
    isArchiving.value = false;
  }
};

onMounted(() => {
  fetchOrders();
  if (orderModalRef.value) {
    orderModal = new window.bootstrap.Modal(orderModalRef.value);
  }
});

onUnmounted(() => {
  if (orderModal) {
    orderModal.dispose();
  }
});
</script>
