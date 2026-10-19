import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'public/index.html'),
        winery: path.resolve(__dirname, 'public/list-winery.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
