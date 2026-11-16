import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served from https://<user>.github.io/portfolio-v2/ on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/portfolio-v2/",
  plugins: [react(), tailwindcss()],
  // three.js ships as its own lazy chunk behind the page
  build: { chunkSizeWarningLimit: 600 },
});
