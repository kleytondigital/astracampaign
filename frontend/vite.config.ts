import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Define a URL do backend para build de produção
    'import.meta.env.VITE_API_URL': JSON.stringify('VITE_API_URL_PLACEHOLDER'),
  },
  esbuild: false,
  server: {
    port: 3006,
    host: true,
    allowedHosts: [
      'localhost',
      'interjectural-woaded-shavonda.ngrok-free.dev', // Domínio ngrok
      '.ngrok-free.dev', // Qualquer subdomínio ngrok
      '.ngrok.io', // ngrok.io também
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash]-new.[ext]',
        chunkFileNames: 'assets/[name]-[hash]-new.js',
        entryFileNames: 'assets/[name]-[hash]-new.js',
      },
    },
  },
});
