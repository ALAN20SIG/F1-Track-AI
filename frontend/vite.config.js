import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // Fix WebSocket/HMR connection issues
    hmr: {
      timeout: 5000,
      overlay: false
    },
    // Optimize connection handling
    watch: {
      usePolling: false,
      interval: 1000
    }
  },
  // Optimize build performance
  build: {
    sourcemap: false,
    minify: 'esbuild'
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom'],
    force: false
  }
})
