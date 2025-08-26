import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// Derive git metadata for dynamic version display
const gitCommit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'unknown'; }
})();
const gitCount = (() => {
  try { return execSync('git rev-list --count HEAD').toString().trim(); } catch { return '0'; }
})();
// Values will be inlined at build time via define
const buildMeta = {
  version: pkg.version,
  commit: gitCommit,
  build: gitCount,
  buildTime: new Date().toISOString()
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(buildMeta.version),
    __APP_COMMIT__: JSON.stringify(buildMeta.commit),
    __APP_BUILD__: JSON.stringify(buildMeta.build),
    __APP_BUILD_TIME__: JSON.stringify(buildMeta.buildTime)
  },
  base: '/swaxi-dispo-v6/',
  server: {
    port: 5173,
    open: true
  },
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase'
    }
  },
  build: {
    cssMinify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});