<!-- FILE: admin/src/views/EmailTemplates.vue -->
<template>
  <div class="container-fluid mt-4">
    <!-- Header -->
    <div class="row">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2>Email Templates</h2>
          <button class="btn btn-success" @click="openCreateModal">
            <i class="bi bi-plus-circle me-2"></i>Create Custom Template
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Templates Table -->
    <div v-else class="card">
      <div class="table-responsive p-3">
        <table class="table table-hover card-table">
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Slug</th>
              <th>Type</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in allTemplates" :key="template.slug">
              <td>
                {{ template.name }}
                <small v-if="template.description" class="d-block text-muted">{{ template.description }}</small>
              </td>
              <td><code>{{ template.slug }}</code></td>
              <td>
                <span class="badge" :class="template.type === 'System' ? 'bg-secondary-subtle text-info-emphasis' : 'bg-secondary-subtle text-secondary-emphasis'">
                  {{ template.type }}
                </span>
              </td>
              <td>
                <span v-if="template.exists" class="badge" :class="template.isActive ? 'bg-success' : 'bg-secondary'">
                  {{ template.isActive ? 'Active' : 'Inactive' }}
                </span>
                <span v-else class="badge bg-warning">
                  Missing
                </span>
              </td>
              <td class="text-end">
                <button v-if="template.exists" class="btn btn-sm btn-outline-secondary" @click="openEditModal(template)">
                  Edit
                </button>
                <button v-else class="btn btn-sm btn-primary" @click="openCreateModal(template.slug)">
                  Create
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <div class="modal fade" id="templateModal" tabindex="-1" aria-labelledby="templateModalLabel" aria-hidden="true" ref="modalElement">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="templateModalLabel">{{ isNewTemplate ? 'Create New Template' : 'Edit Template' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTemplate">
              <!-- Name -->
              <div class="mb-3">
                <label for="templateName" class="form-label">Template Name</label>
                <input type="text" class="form-control" id="templateName" v-model="form.name" required>
              </div>
              <!-- Slug -->
              <div class="mb-3">
                <label for="templateSlug" class="form-label">Slug</label>
                <input type="text" class="form-control" id="templateSlug" v-model="form.slug" :disabled="isProtected" required>
              </div>
              <!-- Subject -->
              <div class="mb-3">
                <label for="templateSubject" class="form-label">Email Subject</label>
                <input type="text" class="form-control" id="templateSubject" v-model="form.subject" required>
              </div>
              <!-- Body -->
              <div class="mb-3">
                <label for="templateBody" class="form-label">Email Body (HTML/EJS)</label>
                <textarea class="form-control" id="templateBody" rows="15" v-model="form.body" required></textarea>
              </div>
              <!-- Is Active Toggle -->
              <div class="form-check form-switch mb-4">
                <input class="form-check-input" type="checkbox" role="switch" id="isActiveSwitch" v-model="form.isActive">
                <label class="form-check-label" for="isActiveSwitch">Template is Active</label>
              </div>
              <!-- Action Buttons -->
              <div class="d-flex justify-content-between">
                <div>
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                    {{ saving ? 'Saving...' : 'Save Template' }}
                  </button>
                  <button type="button" class="btn btn-secondary ms-2" data-bs-dismiss="modal">Cancel</button>
                </div>
                <button
                  v-if="!isNewTemplate && !isProtected"
                  type="button"
                  class="btn btn-danger"
                  @click="deleteTemplate"
                  :disabled="deleting"
                >
                   <span v-if="deleting" class="spinner-border spinner-border-sm"></span>
                  {{ deleting ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { addNotification } from '@/composables/useNotifier';
import apiClient from '@/utils/apiClient';
import { Modal } from 'bootstrap';

// --- STATE ---
const templates = ref([]);
const requiredSlugs = ref([]);
const form = ref({});
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const isNewTemplate = ref(false);

// Modal state
const modalElement = ref(null);
let modalInstance = null;

const protectedSlugs = [
  'order-confirmation', 'order-shipped', 'order-cancelled', 
  'pending-payment-instructions', 'password-reset', 'user-registration-confirmation'
];

// --- COMPUTED ---
const isProtected = computed(() => {
  return form.value && protectedSlugs.includes(form.value.slug);
});

const allTemplates = computed(() => {
  const existingTemplatesMap = new Map(templates.value.map(t => [t.slug, t]));
  const allKnownSlugs = new Set(templates.value.map(t => t.slug));
  requiredSlugs.value.forEach(req => allKnownSlugs.add(req.slug));

  const result = [];

  // Process system templates first
  requiredSlugs.value.forEach(req => {
    const existing = existingTemplatesMap.get(req.slug);
    result.push({
      _id: existing?._id,
      name: existing?.name || req.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: req.slug,
      description: req.description,
      isActive: existing?.isActive ?? false,
      exists: !!existing,
      type: 'System'
    });
  });

  // Add any remaining custom templates
  templates.value.forEach(t => {
    if (!protectedSlugs.includes(t.slug)) {
      result.push({ ...t, exists: true, type: 'Custom' });
    }
  });

  return result;
});

// --- METHODS ---
const fetchData = async () => {
  loading.value = true;
  try {
    const [templatesRes, slugsRes] = await Promise.all([
      apiClient('/email-templates'),
      apiClient('/email-templates/system-slugs')
    ]);
    templates.value = templatesRes;
    requiredSlugs.value = slugsRes;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
};

const openEditModal = (template) => {
  isNewTemplate.value = false;
  // Find the full template data from the original list to ensure we have all fields
  const fullTemplateData = templates.value.find(t => t._id === template._id);
  form.value = { ...fullTemplateData };
  modalInstance.show();
};

const openCreateModal = (slug = '') => {
  isNewTemplate.value = true;
  form.value = {
    name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '',
    slug: slug,
    subject: '',
    body: '<!DOCTYPE html>\n<html>\n<head>\n  <style></style>\n</head>\n<body>\n  \n</body>\n</html>',
    isActive: true
  };
  modalInstance.show();
};

const saveTemplate = async () => {
  saving.value = true;
  const method = isNewTemplate.value ? 'POST' : 'PUT';
  const url = isNewTemplate.value ? '/email-templates' : `/email-templates/${form.value._id}`;
  try {
    await apiClient(url, { method, body: form.value });
    await fetchData();
    modalInstance.hide();
  } catch (error) {
    console.error('Save template failed:', error);
  } finally {
    saving.value = false;
  }
};

const deleteTemplate = async () => {
  if (!confirm(`Are you sure you want to delete "${form.value.name}"?`)) return;
  deleting.value = true;
  try {
    await apiClient(`/email-templates/${form.value._id}`, { method: 'DELETE' });
    await fetchData();
    modalInstance.hide();
  } catch (error) {
    console.error('Delete template failed:', error);
  } finally {
    deleting.value = false;
  }
};

// --- LIFECYCLE HOOKS ---
onMounted(() => {
  fetchData();
  if (modalElement.value) {
    modalInstance = new Modal(modalElement.value);
  }
});

onUnmounted(() => {
  if (modalInstance) {
    modalInstance.dispose();
  }
});
</script>

<style scoped>
.table-responsive {
  min-height: 400px; /* Prevent layout shift while loading */
}
.card-table {
  margin-bottom: 0;
}
.card-table small {
  font-size: 0.8em;
  color: var(--bs-secondary-color);
}
#templateBody {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  min-height: 300px;
}
.badge {
  font-weight: 500;
}
</style>
