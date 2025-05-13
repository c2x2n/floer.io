import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5173,
        host: "0.0.0.0",
        hmr: true,
        watch: {
            usePolling: true
        }
    }
});
