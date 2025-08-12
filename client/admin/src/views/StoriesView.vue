<template>
  <div>
    <div class="card">
      <div class="p-3">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Stories <small>({{ stories.length }})</small></h5>
          <button @click="openAddModal" class="btn btn-primary btn-sm ms-auto">
            <i class="ph-duotone ph-plus me-2"></i>
            Add New Story
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="stories.length === 0" class="text-center text-muted py-5">
          No stories found. Click the button above to add one!
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-3">
            <thead>
              <tr>
                <th>Title</th>
                <th v-for="location in availableLocations" :key="location.value" class="text-center">{{ location.label }}</th>
                <th>Start Date</th>
                <th>End</th>
                <th class="text-end"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="story in paginatedStories" :key="story._id" :class="{ 'expired-story': isDateExpired(story.endDate) }">
                <td>{{ story.title }}</td>
                <td v-for="location in availableLocations" :key="location.value" class="text-center">
                  <i v-if="(story.displayLocations || []).includes(location.value)" class="ph-duotone ph-check-fat text-success"></i>
                  <span v-else>-</span>
                </td>
                <td>{{ story.startDate ? new Date(story.startDate).toLocaleDateString() : '-' }}</td>
                <td>
                  <span v-if="story.endDate">
                    <span :class="{ 
                      'text-danger fw-bold': isDateExpired(story.endDate), 
                      'text-warning fw-bold': !isDateExpired(story.endDate) && isDateWithinAWeek(story.endDate) 
                    }">
                      {{ new Date(story.endDate).toLocaleDateString() }}
                    </span>
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="text-end">
                  <button @click="selectStoryForEdit(story)" class="btn btn-sm btn-outline-secondary border-0 me-2"><i class="ph-duotone ph-pencil-simple"></i></button>
                  <button @click="deleteStory(story._id)" class="btn btn-sm btn-outline-danger border-0"><i class="ph-duotone ph-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="totalPages > 1" class="card-footer d-flex justify-content-between align-items-center">
        <div>
          <label for="itemsPerPage" class="form-label me-2 small">Items per page:</label>
          <select v-model.number="itemsPerPage" id="itemsPerPage" class="form-select form-select-sm d-inline-block" style="width: auto;">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option :value="stories.length">All</option>
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

    <div class="modal fade" id="storyModal" tabindex="-1" aria-labelledby="storyModalLabel" aria-hidden="true" ref="storyModalRef">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="storyModalLabel">{{ formTitle }}</h5>
            <button type="button" class="btn-close" @click="cancelEdit" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFormSubmit">
              <div class="row g-3">
                <div class="col-12">
                  <label for="title" class="form-label">Header Text (Title)</label>
                  <input type="text" v-model="storyForm.title" id="title" required class="form-control" />
                </div>
                
                <div class="col-12">
                  <label class="form-label">Display Locations</label>
                  <div class="d-flex flex-wrap gap-3">
                    <div class="form-check" v-for="location in availableLocations" :key="location.value">
                      <input class="form-check-input" type="checkbox" :value="location.value" :id="`loc-${location.value}`" v-model="storyForm.displayLocations">
                      <label class="form-check-label" :for="`loc-${location.value}`">{{ location.label }}</label>
                    </div>
                  </div>
                </div>

                <div class="col-12">
                   <label class="form-label">Content Text</label>
                   <div ref="quillEditorRef" style="height: 250px;"></div>
                </div>
                <div class="col-md-3">
                    <label for="startDate" class="form-label">Start Date</label>
                    <input type="date" v-model="storyForm.startDate" id="startDate" class="form-control" />
                </div>
                <div class="col-md-3">
                    <label for="endDate" class="form-label">End Date (optional)</label>
                    <input type="date" v-model="storyForm.endDate" id="endDate" class="form-control" />
                </div>     
                <div class="col-md-3">
                    <label class="form-label">Story Image</label>
                    <button type="button" class="btn btn-outline-secondary" @click="requestMainImage">
                      Select or Upload Story Image
                    </button>
                </div>
                <div v-if="storyForm.image && storyForm.image.path" class="col-md-3 mt-3">
                    <p class="form-label">Current Image:</p>
                    <div class="position-relative" style="width: 100%;">
                        <img :src="getImageUrl(storyForm.image.path)" style="width: 150px; height: 150px; object-fit: cover;" class="rounded border" />
                        <button @click.prevent="removeImage" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1">&times;</button>
                    </div>
                    <input type="text" v-model="storyForm.image.text" class="form-control form-control-sm mt-2" placeholder="Optional caption...">
                </div>
        
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelEdit">Close</button>
            <button type="button" class="btn btn-primary" @click="handleFormSubmit">{{ submitButtonText }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted, nextTick, watch } from 'vue';
import apiClient from '@/utils/apiClient';
import eventBus from '@/utils/eventBus';

const stories = ref([]);
const storyForm = reactive({
  _id: null,
  title: '',
  content: '',
  image: null,
  displayLocations: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: null
});
const isEditing = ref(false);
const storyModalRef = ref(null);
const quillEditorRef = ref(null);
let quillInstance = null;
let quillSavedRange = null; 

const availableLocations = [
  { value: 'front-page', label: 'Front Page' },
  { value: 'about-page', label: 'About Page' },
  { value: 'productdetail-page', label: 'Product Detail Page' },
  { value: 'checkout-page', label: 'Checkout Page' },
];

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(10);

const formTitle = computed(() => isEditing.value ? 'Edit Story' : 'Add a New Story');
const submitButtonText = computed(() => isEditing.value ? 'Update Story' : 'Save Story');

const totalPages = computed(() => Math.ceil(stories.value.length / itemsPerPage.value));
const paginatedStories = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage.value;
  const endIndex = startIndex + itemsPerPage.value;
  return stories.value.slice(startIndex, endIndex);
});

const isDateExpired = (dateString) => {
  if (!dateString) return false;
  const endDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return endDate < today;
};

const isDateWithinAWeek = (dateString) => {
  if (!dateString) return false;
  const endDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(now.getDate() + 7);
  oneWeekFromNow.setHours(0, 0, 0, 0);
  return endDate >= now && endDate <= oneWeekFromNow;
};

watch(itemsPerPage, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1;
});

const getImageUrl = (filePath) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${filePath}`;
};

const imageHandler = () => {
    if (!quillInstance) return;
    quillSavedRange = quillInstance.getSelection(true);
    eventBus.emit('open-image-picker', (imagePath) => {
      if (!quillInstance) return;
      const imageUrl = getImageUrl(imagePath);
      const range = quillSavedRange || quillInstance.getSelection(true);
      quillInstance.insertEmbed(range.index, 'image', imageUrl);
      quillSavedRange = null;
    });
};

const requestMainImage = () => {
  eventBus.emit('open-image-picker', (imagePath) => {
    storyForm.image = { path: imagePath, text: '' };
  });
};

const initializeQuill = () => {
    if (quillEditorRef.value && !quillInstance) {
        quillInstance = new Quill(quillEditorRef.value, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'clean']
                    ],
                    handlers: { 'image': imageHandler }
                }
            }
        });
    }
};

const removeImage = () => {
    storyForm.image = null;
};

const fetchStories = async () => {
  try {
    stories.value = await apiClient('/stories');
  } catch (error) {
    console.error('Error fetching stories:', error);
  }
};

const handleFormSubmit = async () => {
  if (!quillInstance) {
    console.error("Quill instance not found. Aborting save.");
    return;
  }
  storyForm.content = quillInstance.root.innerHTML;
  const promise = isEditing.value ? updateStory() : createStory();
  try {
      await promise;
      window.bootstrap.Modal.getInstance(storyModalRef.value)?.hide();
  } catch (error) {
      // error handled by apiClient
  }
};

const createStory = async () => {
    await apiClient('/stories', {
      method: 'POST',
      body: JSON.stringify(storyForm)
    });
    await fetchStories();
};

const updateStory = async () => {
    await apiClient(`/stories/${storyForm._id}`, {
      method: 'PUT',
      body: JSON.stringify(storyForm)
    });
    await fetchStories();
};

const deleteStory = async (id) => {
  if (!confirm('Are you sure you want to delete this story?')) return;
  try {
    await apiClient(`/stories/${id}`, { method: 'DELETE' });
    await fetchStories();
  } catch (error) {
    // error handled by apiClient
  }
};

const openAddModal = async () => {
  resetForm();
  window.bootstrap.Modal.getOrCreateInstance(storyModalRef.value).show();
  await nextTick();
  initializeQuill();
  if (quillInstance) {
    quillInstance.root.innerHTML = '';
  }
};

const selectStoryForEdit = async (story) => {
  isEditing.value = true;
  const storyCopy = JSON.parse(JSON.stringify(story));
  storyCopy.startDate = storyCopy.startDate ? new Date(storyCopy.startDate).toISOString().split('T')[0] : null;
  storyCopy.endDate = storyCopy.endDate ? new Date(storyCopy.endDate).toISOString().split('T')[0] : null;
  storyCopy.displayLocations = storyCopy.displayLocations || [];
  Object.assign(storyForm, storyCopy);
  
  window.bootstrap.Modal.getOrCreateInstance(storyModalRef.value).show();
  await nextTick();
  initializeQuill();
  if (quillInstance) {
    quillInstance.root.innerHTML = story.content;
  }
};

const resetForm = () => {
  isEditing.value = false;
  storyForm._id = null;
  storyForm.title = '';
  storyForm.content = '';
  storyForm.image = null;
  storyForm.displayLocations = [];
  storyForm.startDate = new Date().toISOString().split('T')[0];
  storyForm.endDate = null;
  if (quillInstance) {
      quillInstance.root.innerHTML = '';
  }
};

const cancelEdit = () => {
  window.bootstrap.Modal.getInstance(storyModalRef.value)?.hide();
};

onMounted(() => {
  fetchStories();
  if (storyModalRef.value) {
    storyModalRef.value.addEventListener('hidden.bs.modal', (event) => {
        if (event.target === storyModalRef.value) {
            resetForm();
        }
    });
  }
});

onUnmounted(() => {
    if (quillInstance) {
        const toolbar = quillEditorRef.value?.previousElementSibling;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
            toolbar.remove();
        }
        quillInstance = null;
    }
});
</script>

<style scoped>
.expired-story {
  opacity: 0.5;
  text-decoration: line-through;
}
.expired-story .btn {
  text-decoration: none; 
}
</style>
