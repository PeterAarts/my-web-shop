<!-- FILE: src/views/admin/DashboardView.vue -->
<template>
  <div>
    <div v-if="loading" class="text-center text-muted py-5">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading Dashboard Data...</p>
    </div>
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    
    <div v-else class="row g-4">
      <!-- Main Content Column -->
      <div class="col-lg">
        <div class="vstack gap-4">
          <!-- Sales Activity Card -->
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="card-title text-uppercase">Sales Activity (Last 30 Days)</h5>
              <div style="height: 280px; position: relative;">
                <ActivityChart :chart-data="activityData" />
              </div>
            </div>
          </div>

          <!-- Recent Orders Card -->
          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="card-title text-uppercase">Recent Orders</h5>
              <RecentOrdersTable :orders="recentOrders" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar Column -->
      <div class="col-lg-2">
        <div class="vstack gap-4">
          <StatsCard 
            title="Total Products" 
            :value="stats.totalProducts" 
            icon="ph-duotone ph-package"
            description="Currently in your inventory"
          />
          <StatsCard 
            title="Total Users" 
            :value="stats.totalUsers" 
            icon="ph-duotone ph-users"
            description="Registered customers & admins"
          />
          <StatsCard 
            title="Active Sessions" 
            :value="stats.activeSessions" 
            icon="ph-duotone ph-wifi-high"
            description="All visitors active right now"
          />
          <StatsCard 
            title="Total Stories" 
            :value="stats.totalStories" 
            icon="ph-duotone ph-notebook"
            description="Published and draft stories"
          />
          <StatsCard 
            title="New Orders" 
            :value="stats.newOrders" 
            icon="ph-duotone ph-bell"
            description="Orders awaiting processing"
            :variant="stats.newOrders > 0 ? 'success' : ''"
          />
          <StatsCard 
            title="Sales (Last 30 Days)" 
            :value="`€${stats.salesTotal.toFixed(2)}`" 
            icon="ph-duotone ph-trend-up"
            description="Total revenue from recent orders"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, defineComponent, h, computed } from 'vue';
import apiClient from '@/utils/apiClient';
import { Chart } from 'vue-chartjs'; // UPDATED: Import generic Chart component
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement, 
  CategoryScale, 
  LinearScale,
  LineElement, // ADDED: For line charts
  PointElement // ADDED: For points on the line
} from 'chart.js';

// UPDATED: Register new elements for the line chart
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, LineElement, PointElement);

// --- Child Components defined directly for simplicity ---

const StatsCard = defineComponent({
  name: 'StatsCard',
  props: {
    title: { type: String, required: true },
    value: { type: [String, Number], required: true },
    icon: { type: String, default: '' },
    description: { type: String, default: '' },
    variant: { type: String, default: '' }
  },
  setup(props) {
    const variantClass = computed(() => props.variant ? `bg-${props.variant} text-white` : '');
    const textMutedClass = computed(() => props.variant ? 'text-white-75' : 'text-muted');
    const iconWrapperClass = computed(() => props.variant ? 'bg-white bg-opacity-25 text-white' : 'bg-white bg-opacity-25 text-primary');

    return () => h('div', { class: `card shadow-sm border-0 h-100 ${variantClass.value}` }, [
      h('div', { class: 'card-body' }, [
        h('div', { class: 'd-flex align-items-center' }, [
          h('div', { class: 'flex-grow-1' }, [
            h('h6', { class: `mb-2 ${props.variant ? 'text-white-75' : 'text-muted text-uppercase fs-7'}` }, props.title),
            h('h3', { class: 'mb-0 fw-bold' }, props.value),
            props.description && h('p', { class: `mb-0 small ${textMutedClass.value}` }, props.description)
          ]),
          props.icon && h('div', { class: 'flex-shrink-0' }, [
            h('div', { class: `d-flex align-items-center justify-content-center rounded-circle ${iconWrapperClass.value}`, style: 'width: 48px; height: 48px;' }, [
              h('i', { class: `fs-4 ${props.icon}` })
            ])
          ])
        ])
      ])
    ]);
  }
});

// UPDATED: Renamed component and changed to use the generic Chart component
const ActivityChart = defineComponent({
  name: 'ActivityChart',
  components: { Chart },
  props: ['chartData'],
  setup(props) {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    };
    // The 'type' prop tells Chart.js this is a mixed chart.
    // Individual dataset types will override this default.
    return () => h(Chart, { type: 'bar', data: props.chartData, options: chartOptions });
  }
});

const RecentOrdersTable = defineComponent({
  name: 'RecentOrdersTable',
  props: ['orders'],
  setup(props) {
    const getStatusClass = (status) => {
      const map = { created: 'bg-primary-subtle text-primary-emphasis', shipped: 'bg-success-subtle text-success-emphasis' };
      return map[status] || 'bg-secondary-subtle text-secondary-emphasis';
    };
    return () => h('div', { class: 'table-responsive' }, [
      h('table', { class: 'table table-hover table-sm mb-0' }, [
        h('thead', {}, [
          h('tr', {}, [
            h('th', {}, 'Order #'), h('th', {}, 'Date'), h('th', {}, 'Customer'), h('th', {}, 'Total'), h('th', {}, 'Status')
          ])
        ]),
        h('tbody', {}, props.orders.map(order => 
          h('tr', { key: order._id }, [
            h('td', {}, order.orderNumber || order._id.slice(-6).toUpperCase()),
            h('td', {}, new Date(order.createdAt).toLocaleDateString()),
            h('td', {}, order.user?.username || order.customerDetails.name),
            h('td', {}, `€${order.totalAmount.toFixed(2)}`),
            h('td', {}, h('span', { class: `badge ${getStatusClass(order.status)}` }, order.status))
          ])
        ))
      ])
    ]);
  }
});


// --- Main Dashboard Logic ---
const loading = ref(true);
const error = ref(null);
const stats = reactive({
  totalProducts: 0,
  totalUsers: 0,
  activeSessions: 0,
  totalStories: 0,
  newOrders: 0,
  salesTotal: 0,
});
const activityData = ref({ labels: [], datasets: [] });
const recentOrders = ref([]);
let refreshInterval = null;

const fetchDashboardData = async () => {
  try {
    const [statsRes, activityRes, ordersRes] = await Promise.all([
      apiClient('/dashboard/stats'),
      apiClient('/dashboard/activity'),
      apiClient('/dashboard/recent-orders')
    ]);

    Object.assign(stats, statsRes);
    recentOrders.value = ordersRes;

    const labels = [];
    const ordersPerDay = [];
    const productsSoldPerDay = [];
    
    const dateMap = new Map();
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        dateMap.set(dateString, { ordersPerDay: 0, productsSoldPerDay: 0 });
    }
    
    activityRes.forEach(item => {
        dateMap.set(item._id, {
            ordersPerDay: item.ordersPerDay,
            productsSoldPerDay: item.productsSoldPerDay
        });
    });

    dateMap.forEach((value, key) => {
        labels.push(new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        ordersPerDay.push(value.ordersPerDay);
        productsSoldPerDay.push(value.productsSoldPerDay);
    });

    // UPDATED: Configure datasets for a mixed bar and line chart
    activityData.value = {
      labels,
      datasets: [
        {
          type: 'bar', // This dataset will be a bar chart
          label: 'Orders per Day',
          backgroundColor: '#9D9DCC',
          data: ordersPerDay,
        },
        {
          type: 'line', // This dataset will be a line chart
          label: 'Products Sold per Day',
          borderColor: '#495057',
          backgroundColor: '#495057',
          data: productsSoldPerDay,
          tension: 0.4, // Makes the line smooth
          fill: false,
        }
      ]
    };

  } catch (err) {
    error.value = 'Failed to load dashboard data. Please try again later.';
    console.error(err);
    if (refreshInterval) clearInterval(refreshInterval);
  }
};

onMounted(async () => {
  loading.value = true;
  await fetchDashboardData();
  loading.value = false;

  refreshInterval = setInterval(fetchDashboardData, 300000);
});

onUnmounted(() => {
  clearInterval(refreshInterval);
});
</script>
