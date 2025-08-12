<!-- File: src/views/admin/UsersView.vue -->
<template>
  <div>
    <!-- User List -->
    <div class="card shadow-sm">
       <div class="p-3">
          <div class="d-flex justify-content-between align-items-center ">
            <div class="card-title h5 mb-0">Users <small>({{ users.length }})</small></div>
            <button @click="openAddModal" class="btn btn-primary btn-sm ms-auto"><i class="ph-duotone ph-plus me-2"></i>Add New User</button>
          </div>
      </div>
      <div class="card-body ">
        <div v-if="users.length === 0" class="text-center text-muted py-5">
          No users found.
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-3">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in paginatedUsers" :key="user._id">
                <td>
                  {{ user.username }}
                  <span v-if="authStore.user && authStore.user._id === user._id" class="badge bg-light text-dark ms-2">You</span>
                </td>
                <td>{{ user.email }}</td>
                <td><span class="badge" :class="getRoleClass(user.role)">{{ user.role }}</span></td>
                <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
                <td class="text-end">
                  <button @click="openEditModal(user)" class="btn btn-sm btn-outline-secondary border-0 me-2"><i class="ph-duotone ph-pencil-simple"></i></button>
                  <button 
                    @click="deleteUser(user._id)" 
                    class="btn btn-sm btn-outline-danger border-0"
                    :disabled="authStore.user && authStore.user._id === user._id"
                    title="You cannot delete yourself">
                    <i class="ph-duotone ph-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="card-footer d-flex justify-content-between align-items-center">
        <div>
          <label for="itemsPerPage" class="form-label me-2 small">Items per page:</label>
          <select v-model.number="itemsPerPage" id="itemsPerPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option :value="users.length">All</option>
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

    <!-- Add/Edit User Modal -->
    <div class="modal fade" id="userModal" tabindex="-1" aria-labelledby="userModalLabel" aria-hidden="true" ref="userModalRef">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="userModalLabel">{{ formTitle }}</h5>
            <button type="button" class="btn-close" @click="cancel" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFormSubmit">
              <!-- User Details -->
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input type="text" v-model="userForm.username" id="username" required class="form-control" :disabled="isEditing" />
              </div>
              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" v-model="userForm.email" id="email" required class="form-control" :disabled="isEditing" />
              </div>
              <div class="mb-3">
                <label for="role" class="form-label">Role</label>
                <select v-model="userForm.role" id="role" required class="form-select">
                  <option value="customer">Customer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <!-- Password Section -->
              <hr class="my-4">
              
              <div v-if="!isEditing">
                <h6 class="mb-3">Set Password</h6>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" v-model="userForm.password" id="password" required class="form-control" />
                </div>
              </div>

              <div v-if="isEditing">
                <h6 class="mb-3">Change Password (Optional)</h6>
                <div v-if="authStore.user && authStore.user._id === userForm._id">
                  <div class="mb-3">
                    <label for="currentPassword" class="form-label">Current Password</label>
                    <input type="password" v-model="userForm.currentPassword" id="currentPassword" class="form-control" placeholder="Required to change password" />
                  </div>
                </div>
                <div v-if="authStore.user && authStore.user._id !== userForm._id && userForm.role !== 'admin'">
                   <div class="mb-3">
                    <label for="newPassword" class="form-label">New Password</label>
                    <input type="password" v-model="userForm.newPassword" id="newPassword" class="form-control" />
                  </div>
                  <div class="mb-3">
                    <label for="confirmPassword" class="form-label">Confirm New Password</label>
                    <input type="password" v-model="userForm.confirmPassword" id="confirmPassword" class="form-control" />
                  </div>
                </div>
                <div v-if="authStore.user && authStore.user._id !== userForm._id && userForm.role === 'admin'">
                  <p class="text-muted small">Password for other administrators cannot be changed from this panel.</p>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancel">Close</button>
            <button type="button" class="btn btn-primary" @click="handleFormSubmit">Save User</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import apiClient from '@/utils/apiClient';
import { useNotifier } from '@/composables/useNotifier';

const useAuthStore = () => {
  return {
    user: ref({ _id: 'admin_user_id_placeholder', role: 'admin' }) 
  };
};

const { addNotification } = useNotifier();
const authStore = useAuthStore();
const users = ref([]);
const userModalRef = ref(null);
// REMOVED: let userModal = null;
const isEditing = ref(false);

const currentPage = ref(1);
const itemsPerPage = ref(10);

const userForm = reactive({
  _id: null,
  username: '',
  email: '',
  role: 'customer',
  password: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const formTitle = computed(() => isEditing.value ? `Edit User: ${userForm.username}` : 'Add New User');

const totalPages = computed(() => Math.ceil(users.value.length / itemsPerPage.value));
const paginatedUsers = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return users.value.slice(startIndex, endIndex);
});

watch(itemsPerPage, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1;
});

const fetchUsers = async () => {
  try {
    users.value = await apiClient('/users');
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const handleFormSubmit = async () => {
  const promise = isEditing.value ? updateUser() : createUser();
  try {
    await promise;
    window.bootstrap.Modal.getInstance(userModalRef.value)?.hide();
  } catch (error) {
    // Error is handled by apiClient
  }
};

const createUser = async () => {
  const { username, email, password, role } = userForm;
  await apiClient('/users', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role })
  });
  addNotification('User created successfully!', 'success');
  await fetchUsers();
};

const updateUser = async () => {
  if (userForm.newPassword && userForm.newPassword !== userForm.confirmPassword) {
    addNotification('New passwords do not match.', 'error');
    return;
  }
  if (authStore.user.value._id === userForm._id && userForm.newPassword && !userForm.currentPassword) {
      addNotification('Current password is required to set a new one.', 'error');
      return;
  }

  const payload = { role: userForm.role };
  if (userForm.newPassword) payload.newPassword = userForm.newPassword;
  if (userForm.currentPassword) payload.currentPassword = userForm.currentPassword;

  await apiClient(`/users/${userForm._id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  addNotification('User updated successfully!', 'success');
  await fetchUsers();
};


const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
  try {
    await apiClient(`/users/${id}`, { method: 'DELETE' });
    addNotification('User deleted.', 'info');
    await fetchUsers();
  } catch (error) { /* Handled by apiClient */ }
};

const getRoleClass = (role) => {
  const map = { admin: 'bg-primary', reviewer: 'bg-info', customer: 'bg-secondary' };
  return map[role] || 'bg-light';
};

const resetForm = () => {
  isEditing.value = false;
  Object.assign(userForm, {
    _id: null, username: '', email: '', role: 'customer',
    password: '', currentPassword: '', newPassword: '', confirmPassword: ''
  });
};

const openAddModal = () => {
  resetForm();
  window.bootstrap.Modal.getOrCreateInstance(userModalRef.value).show();
};

const openEditModal = (user) => {
  resetForm();
  isEditing.value = true;
  userForm._id = user._id;
  userForm.username = user.username;
  userForm.email = user.email;
  userForm.role = user.role;
  window.bootstrap.Modal.getOrCreateInstance(userModalRef.value).show();
};

const cancel = () => {
  window.bootstrap.Modal.getInstance(userModalRef.value)?.hide();
};

onMounted(() => {
  fetchUsers();
  if (userModalRef.value) {
    userModalRef.value.addEventListener('hidden.bs.modal', resetForm);
  }
});
</script>
