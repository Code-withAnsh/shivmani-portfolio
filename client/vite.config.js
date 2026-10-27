import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // '/' for Render. GitHub Pages sets BASE_PATH=/shivmani-portfolio/ in the workflow.
  base: process.env.BASE_PATH || '/',
  // In dev, /api goes to the Express backend (same origin as in production)
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});
