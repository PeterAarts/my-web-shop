// File: client/admin/vite.config.js

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      // This is the crucial addition.
      // It tells Vite that any import starting with '@'
      // should be resolved relative to the 'src' directory.
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})