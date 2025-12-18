import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
const env = loadEnv(process.env.NODE_ENV, process.cwd());
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  server: {
    host: true,
    port: 3001,
    open: true,
    proxy: {
      '/ais/proxy': {
        target: env.VITE_API_URL,
        changeOrigin: true,
      },
      '/forecast': {
        target: env.VITE_AIR_GG_URL,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/forecast/, '/airmodel'),
      },
      '/img': {
        target: env.VITE_IMAGE_API_URL,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/img/, ''),
      },
    },
  },
});
