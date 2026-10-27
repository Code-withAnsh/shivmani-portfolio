import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // In dev, /api goes to the Express backend (same origin as in production)
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});
