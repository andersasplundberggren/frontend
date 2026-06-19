import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target: 'https://paplats.pixelworks.se',
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://paplats.pixelworks.se',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
