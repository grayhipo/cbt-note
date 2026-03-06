import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/cbt-note/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        books: resolve(__dirname, 'books/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
      },
    },
  },
})