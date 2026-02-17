import { defineConfig } from 'vite';

export default defineConfig({
  base: '/sniff-3d/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    host: true,
  },
});
