<template>
  <div>
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
      <div class="input-group input-group-sm" style="width: 300px;">
        <span class="input-group-text"><i class="ph-duotone ph-magnifying-glass"></i></span>
        <input type="text" v-model="searchTerm" class="form-control" placeholder="Search by Order # or Customer...">
      </div>
      <select v-if="showFilters" v-model="selectedStatus" class="form-select form-select-sm" style="width: 200px;">
        <option value="all">All Statuses</option>
        <option v-for="status in allowedStatuses" :key="status" :value="status">{{ status }}</option>
      </select>
    </div>

    <div v-if="paginatedOrders.length === 0" class="text-center text-muted py-5">
      No orders found matching the current criteria.
    </div>
    <div v-else class="table-responsive">
      <table class="table table-hover mb-0">
        <thead>
          <tr>
            <th><input type="checkbox" class="form-check-input" @change="selectAll" :checked="allSelected" /></th>
            <th>Order #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th width="1%" class="text-center">Shipment</th>
            <th width="1%" class="text-center">Picking</th>
            <th width="5%"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in paginatedOrders" :key="order._id">
            <td><input type="checkbox" class="form-check-input" :value="order._id" v-model="selectedOrders" /></td>
            <td>{{ order.orderNumber }}</td>
            <td>{{ new Date(order.createdAt).toLocaleDateString() }}</td>
            <td>{{ order.customerDetails.name }}</td>
            <td>€{{ order.totalAmount.toFixed(2) }}</td>
            <td>
              <span class="d-block text-capitalize">{{ order.paymentMethod }}</span>
              <span class="badge" :class="getPaymentStatusClass(order.paymentStatus)">{{ order.paymentStatus }}</span>
            </td>
            <td><span class="badge" :class="getStatusClass(order.status)">{{ order.status }}</span></td>
            <td class="text-center">
              <button
                v-if="['received', 'processing'].includes(order.status)"
                class="btn p-0 fs-5 "
                @click.stop="$emit('create-label', order)"
                title="Create Shipping Label">
                <i class="ph ph-barcode"></i>
              </button>
              <a v-if="order.shippingDetails && order.shippingDetails.labelUrl"
                :href="order.shippingDetails.labelUrl"
                target="_blank"
                class="btn "
                title="View Shipping Label">
                <i class="ph ph-printer"></i>
              </a>
            </td>
            <td class="text-center">
              <!-- Show DOWNLOAD icon if picklist exists -->
              <button v-if="order.picklistFilename"
                class="btn p-0 fs-5 "
                title="Download Pick List"
                @click.stop="$emit('download-picklist', order)">
                <i class="ph ph-file-pdf"></i>
              </button>
              <!-- Show GENERATE icon if picklist is MISSING but should exist -->
              <button v-else-if="['received', 'processing', 'ready for shipment', 'shipped'].includes(order.status)"
                class="btn p-0 fs-5 text-warning"
                title="Generate Pick List"
                @click.stop="$emit('generate-picklist', order)">
                <i class="ph-duotone ph-file-plus"></i>
              </button>
            </td>
            <td class="text-end">
              <button @click="$emit('edit-order', order)" class="btn btn-sm btn-outline-secondary border-0"><i class="ph ph-pencil-simple"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showPagination && totalPages > 1" class="d-flex justify-content-between align-items-center p-3">
      <div>
        <label for="itemsPerPage" class="form-label me-2 small">Items per page:</label>
        <select v-model.number="itemsPerPage" id="itemsPerPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="15">15</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option :value="filteredOrders.length">All</option>
        </select>
      </div>
      <nav>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');

const props = defineProps({
  orders: { type: Array, required: true },
  showFilters: { type: Boolean, default: true },
  showPagination: { type: Boolean, default: true },
  defaultItemsPerPage: { type: Number, default: 5 }
});

const emit = defineEmits([
    'edit-order', 
    'selection-changed', 
    'create-label', 
    'download-picklist',
    'generate-picklist' // NEW: Add the new event
]);

const searchTerm = ref('');
const selectedStatus = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(props.defaultItemsPerPage);
const selectedOrders = ref([]);
const allowedStatuses = ['created', 'received', 'processing', 'ready for shipment', 'pending payment', 'shipped', 'cancelled'];

const filteredOrders = computed(() => {
  let filtered = props.orders;
  if (props.showFilters && selectedStatus.value !== 'all') {
    filtered = filtered.filter(order => order.status === selectedStatus.value);
  }
  if (searchTerm.value) {
    const lowerCaseSearch = searchTerm.value.toLowerCase();
    filtered = filtered.filter(order =>
      order.orderNumber.toLowerCase().includes(lowerCaseSearch) ||
      order.customerDetails.name.toLowerCase().includes(lowerCaseSearch)
    );
  }
  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredOrders.value.length / itemsPerPage.value));

const paginatedOrders = computed(() => {
  if (!props.showPagination) {
    return filteredOrders.value;
  }
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return filteredOrders.value.slice(startIndex, endIndex);
});

const allSelected = computed(() => {
    return paginatedOrders.value.length > 0 && selectedOrders.value.length === paginatedOrders.value.length;
});

watch([searchTerm, selectedStatus], () => { currentPage.value = 1; });
watch(selectedOrders, (newSelection) => { emit('selection-changed', newSelection); });
watch(() => props.orders, () => { currentPage.value = 1; });

const selectAll = (event) => {
    if (event.target.checked) {
        selectedOrders.value = paginatedOrders.value.map(order => order._id);
    } else {
        selectedOrders.value = [];
    }
};

const getStatusClass = (status) => {
  const map = { shipped: 'bg-success', processing: 'bg-info', cancelled: 'bg-danger', 'pending payment': 'bg-warning text-dark', 'ready for shipment': 'bg-primary', 'received': 'bg-success', 'created': 'bg-secondary' };
  return map[status] || 'bg-light text-dark';
};

const getPaymentStatusClass = (status) => {
  const map = { paid: 'bg-success', COMPLETED: 'bg-success', pending: 'bg-warning text-dark', failed: 'text-danger' };
  return map[status] || 'bg-light text-dark';
};
</script>
