import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // --- ADD THIS SERVER BLOCK ---
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Points to your new backend port
        secure: false,
        changeOrigin: true,
      },
      '/Theater_Img': {
        target: 'http://localhost:3001', // Points to your backend
        secure: false,
        changeOrigin: true,
      }
    }
  }
  // ------------------------------
})