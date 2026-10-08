import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEnv } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, currentDir, "");
  const apiPort = environment.PORT || "7000";

  return {
    plugins: [react()],
    build: {
      outDir: "dist/client",
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        "@client": path.join(currentDir, "client", "src"),
        "@shared": path.join(currentDir, "shared"),
      },
    },
    server: {
      port: 7002,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        "/auth": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
