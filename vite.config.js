import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the built app work on GitHub Pages subpaths.
// For Vercel/Netlify, this also works fine for a simple static demo.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
