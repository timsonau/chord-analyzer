// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import path from "path";

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    https: {
      key: "./certs/key.pem",
      cert: "./certs/cert.pem",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
