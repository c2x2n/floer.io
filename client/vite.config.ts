import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@common': fileURLToPath(new URL('../common/src', import.meta.url)),
    }
  }, server: {
        port: 5173,
        host: "0.0.0.0",
        hmr: true,
        watch: {
            usePolling: true
        },
  }
});
