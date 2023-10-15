import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import path from 'path';

const TARGET = process.env.FE_TARGET || 'http://localhost:3443';

export default defineConfig({
  plugins: [createVuePlugin()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: TARGET,
        secure: false,
        changeOrigin: false,
        rewrite: (_path) => _path.replace(/^\/api/, '/api'),
      },
      '/swagger-docs': {
        target: TARGET,
        secure: false,
        changeOrigin: false,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
      {
        find: '~',
        replacement: path.resolve(__dirname, 'node_modules'),
      },
    ],
  },
  build: {
    cssCodeSplit: true,
  },
});
