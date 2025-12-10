import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: path.resolve(__dirname, 'public/index.html'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
