export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    },
    chunkSizeWarningLimit: 1000 // increase limit
  }
}
