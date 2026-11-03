import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Suppress the chunk size warning for submission
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
  },
})
