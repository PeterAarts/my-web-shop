<template>
  <div>
    <div class="card">
      <div class="p-3 border-bottom">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">Image Management <small>({{ images.length }})</small></h5>
          <input type="file" ref="uploadInputRef" @change="handleUpload" accept="image/*" class="d-none" multiple>
          <button @click="triggerUpload" class="btn btn-primary btn-sm" :disabled="isUploading">
            <span v-if="isUploading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i v-else class="ph ph-upload-simple me-2"></i>
            {{ isUploading ? 'Uploading...' : 'Upload New' }}
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
        </div>
        <div v-else-if="images.length === 0" class="text-center text-muted py-5">
          No images found. Upload one to get started!
        </div>
        <div v-else class="image-grid">
          <div v-for="image in images" :key="image.path" class="">
            <div class="img-card" @click="openImageDetails(image)">
              <img :src="getImageUrl(image.path)" :alt="image.filename" class="img-fluid rounded">
              <div class="img-overlay">
                <p class="img-filename" :title="image.filename">{{ image.filename }}</p>
                <button @click.stop="deleteImage(image.filename)" class="btn btn-sm btn-danger border-0" title="Delete Image">
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="detailModalRef" tabindex="-1" aria-labelledby="imageDetailModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div v-if="selectedImage" class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="imageDetailModalLabel">Image Details</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6 mb-3 mb-md-0">
                <img :src="getImageUrl(selectedImage.path)" :alt="selectedImage.filename" class="img-fluid rounded border">
              </div>
              <div class="col-md-6">
                <ul class="list-group list-group-flush">
                  <li class="list-group-item ps-0 d-flex justify-content-between">
                    <strong>Filename:</strong>
                    <span class="text-muted text-break">{{ selectedImage.filename }}</span>
                  </li>
                  <li class="list-group-item ps-0 d-flex justify-content-between">
                    <strong>Dimensions:</strong>
                    <span class="text-muted">{{ selectedImage.dimensions.width }} x {{ selectedImage.dimensions.height }} px</span>
                  </li>
                  <li class="list-group-item ps-0 d-flex justify-content-between">
                    <strong>File Size:</strong>
                    <span class="text-muted">{{ formatSize(selectedImage.size) }}</span>
                  </li>
                  <li class="list-group-item ps-0 d-flex justify-content-between">
                    <strong>Created:</strong>
                    <span class="text-muted">{{ new Date(selectedImage.createdAt).toLocaleDateString() }}</span>
                  </li>
                </ul>
                <div class="mt-3">
                  <strong class="d-block mb-2">Currently Used In:</strong>
                  <div v-if="isUsageLoading" class="text-center">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                  </div>
                  <ul v-else-if="imageUsage.length > 0" class="list-group list-group-flush">
                    <li v-for="(item, index) in imageUsage" :key="index" class="list-group-item ps-0">
                      <span class="badge me-2" :class="getUsageBadgeClass(item.type)">{{ item.type }}</span>
                      {{ item.name }}
                    </li>
                  </ul>
                  <p v-else class="text-muted">This image is not currently used.</p>
                </div>
                <button @click="deleteImage(selectedImage.filename, true)" class="btn btn-danger w-100 mt-3">
                  <i class="ph ph-trash me-2"></i>Delete This Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import apiClient from '@/utils/apiClient';

const images = ref([]);
const loading = ref(true);
const isUploading = ref(false);
const uploadInputRef = ref(null);
const detailModalRef = ref(null);
const selectedImage = ref(null);
let modalInstance = null;
const imageUsage = ref([]);
const isUsageLoading = ref(false);

const fetchImages = async () => {
  loading.value = true;
  try { images.value = await apiClient('/images'); } 
  catch (error) { /* Handled */ } 
  finally { loading.value = false; }
};

const triggerUpload = () => { uploadInputRef.value.click(); };

const handleUpload = async (event) => {
  const files = event.target.files;
  if (!files.length) return;

  // MODIFIED: Ask the user if they want to resize the image(s)
  const shouldResize = confirm('Do you want to resize the image(s) to a maximum of 700px? (This is recommended for web performance)');

  isUploading.value = true;
  const uploadPromises = Array.from(files).map(file => {
    const formData = new FormData();
    formData.append('productImage', file);
    // MODIFIED: Pass the user's choice to the API endpoint
    const endpoint = `/upload?resize=${shouldResize}`;
    return apiClient(endpoint, { method: 'POST', body: formData });
  });

  try { await Promise.all(uploadPromises); } 
  catch (error) { /* Handled */ } 
  finally {
    isUploading.value = false;
    uploadInputRef.value.value = '';
    await fetchImages();
  }
};

const deleteImage = async (filename, fromModal = false) => {
  if (fromModal) { modalInstance.hide(); }
  if (!confirm(`Are you sure you want to permanently delete "${filename}"?`)) return;
  try {
    await apiClient(`/images/${filename}`, { method: 'DELETE' });
    await fetchImages();
  } catch (error) { /* Handled */ }
};

const openImageDetails = async (image) => {
  selectedImage.value = image;
  imageUsage.value = [];
  isUsageLoading.value = true;
  if (modalInstance) { modalInstance.show(); }
  try { imageUsage.value = await apiClient(`/images/usage/${image.filename}`); } 
  catch (error) { /* Handled */ } 
  finally { isUsageLoading.value = false; }
};

watch(detailModalRef, (newEl) => {
  if (newEl && !modalInstance) {
    modalInstance = new window.bootstrap.Modal(newEl);
  }
});

const getImageUrl = (filePath) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${filePath}`;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
};

const getUsageBadgeClass = (type) => {
  switch (type) {
    case 'Story': return 'bg-primary';
    case 'Product': return 'bg-success';
    case 'Setting': return 'bg-info';
    default: return 'bg-secondary';
  }
};

onMounted(() => { fetchImages(); });
</script>

<style scoped>
.img-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  max-width: 100px;
}
.img-card .img-fluid {
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
}

.image-grid-item {
  flex: 1 0 120px; /* Grow, shrink, min width */
  max-width: 180px; /* Optional: limit max width */
  min-width: 120px;
  display: flex;
}

.img-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  width: 100%;
  aspect-ratio: 1 / 1; /* Maintain square shape */
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.img-card .img-fluid {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Maintain aspect ratio, show full image */
  aspect-ratio: 1 / 1;
  display: block;
}
.img-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%);
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.img-card:hover .img-overlay {
  opacity: 1;
}
.img-filename {
  margin: 0;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 0.5rem;
}
.text-break {
  word-break: break-all;
}
</style>