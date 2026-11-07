// vite.config.js - Vite configuration with React plugin and API proxy
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Vite configuration definition.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
