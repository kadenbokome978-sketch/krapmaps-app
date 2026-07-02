import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split React into its own long-lived chunk. App code changes on nearly
        // every deploy; React does not — so returning visitors keep React cached
        // and only re-download the (smaller) app chunk.
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
