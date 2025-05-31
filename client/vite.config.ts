import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5173,
        host: "0.0.0.0",
        hmr: true,
        watch: {
            usePolling: true
        }
    },
    plugins: [
        wasm(),
        topLevelAwait()
    ]
});
