
<template>
  <section v-if="localStories.length > 0">
    <h4 class="mb-4">{{ title }}</h4>
    <div class="row row-cols-1 row-cols-md-2 g-4">
      <div v-for="story in localStories" :key="story._id" class="col">
        <div class="card h-100 story-card" @click="openStoryModal(story)">
          <div class="row g-0 h-100">
            <template v-if="story.image">
              <div class="col-4">
                <img :src="getStoryImageUrl(story.image.path)" @error="onImageError(story)" class="card-img-left rounded-start" :alt="story.image.text || story.title">
              </div>
              <div class="col-8">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">{{ story.title }}</h5>
                    <span class="text-muted small ms-2 text-nowrap">{{ formatDate(story.startDate) }}</span>
                  </div>
                  <div class="card-text small story-summary" v-html="story.content"></div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="col-12">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">{{ story.title }}</h5>
                    <span class="text-muted small ms-2 text-nowrap">{{ formatDate(story.startDate) }}</span>
                  </div>
                  <div class="card-text small story-summary" v-html="story.content"></div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" ref="storyModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered">
        <div v-if="selectedStory" class="modal-content overflow-hidden">
          <div class="modal-body p-0">
            <template v-if="selectedStory.image">
              <div class="row g-0">
                <div class="col-md-4 bg-light p-4">
                    <div class="flex justify-content-between align-items-start mb-3">
                      <h3 class="mt-0 mb-0">{{ selectedStory.title }}</h3>
                      <div class="text-muted small text-nowrap"><i class="ph-fill ph-calendar"></i> {{ formatDate(selectedStory.startDate) }}</div>
                    </div>
                    <hr>                  
                  <img :src="getStoryImageUrl(selectedStory.image.path)" @error="onImageError(selectedStory)" class="modal-story-image rounded" :alt="selectedStory.image.text">
                </div>
                <div class="col-md-8 position-relative">
                  <button type="button" class="btn-close position-absolute top-0 end-0 m-3 p-3" style="z-index: 10;" data-bs-dismiss="modal" aria-label="Close"></button>
                  <div class="story-content-scroll p-4 mt-5">
                    <div v-html="selectedStory.content"></div>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="position-relative">
                <button type="button" class="btn-close position-absolute top-0 end-0 m-3 p-3" style="z-index: 10;" data-bs-dismiss="modal" aria-label="Close"></button>
                <div class="story-content-scroll p-4">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <h3 class="mt-0 mb-0">{{ selectedStory.title }}</h3>
                    <span class="text-muted small ms-3 text-nowrap">{{ formatDate(selectedStory.startDate) }}</span>
                  </div>
                  <div v-html="selectedStory.content"></div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';

const props = defineProps({
  stories: { type: Array, required: true },
  title: { type: String, default: 'More Stories' }
});

const localStories = ref([]);

watch(() => props.stories, (newStories) => {
  localStories.value = JSON.parse(JSON.stringify(newStories));
}, { immediate: true, deep: true });

const storyModalRef = ref(null);
const selectedStory = ref(null);
let modalInstance = null;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const getStoryImageUrl = (filePath) => {
  if (!filePath) return '';
  const trimmedPath = filePath.trim();
  if (trimmedPath.startsWith('http')) return trimmedPath;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseUrl.replace('/api', '')}${trimmedPath}`;
}

// REMOVED: The old truncateText function is no longer needed.

const openStoryModal = (story) => {
  selectedStory.value = story;
  if (modalInstance) {
    modalInstance.show();
  }
};

const onImageError = (storyWithError) => {
  console.warn(`Image not found for story: "${storyWithError.title}". Rendering text-only view.`);
  const storyInList = localStories.value.find(s => s._id === storyWithError._id);
  if (storyInList) {
    storyInList.image = null;
  }
  if (selectedStory.value && selectedStory.value._id === storyWithError._id) {
    selectedStory.value.image = null;
  }
};

watch(storyModalRef, (newEl) => {
  if (newEl && !modalInstance) {
    modalInstance = new window.bootstrap.Modal(newEl);
  }
});

onUnmounted(() => {
  if (modalInstance) {
    modalInstance.dispose();
  }
});
</script>

<style scoped>
/* (All existing styles remain the same) */
.story-card {
  cursor: pointer;
  max-height: 175px;
  overflow: hidden;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: 1px solid var(--bs-border-color-translucent);
}
.story-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.card-img-left {
  width: 100%;
  height: 175px;
  object-fit: cover;
}
.card-body {
  display: flex;
  flex-direction: column;
}
.story-content-scroll {
  height: 80vh;
  max-height: 80vh; 
  overflow-y: auto;
}
.modal-story-image {
  width: 100%;
  height: auto;
  object-fit: contain; 
}

/* NEW: CSS for truncating the summary text */
.story-summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4; /* Adjust this number to show more or fewer lines */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
```