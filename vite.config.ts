import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173
  },
  test: {
    setupFiles: ["./tests/setup.ts"]
  }
});
