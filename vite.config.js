import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Base44-generated apps use the "@/" alias mapped to ./src.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
