// vite.config.ts
import { resolve } from "node:path";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
  server: {
    port: 3000,
  },

  // Three.js WebGPU/TSL optimizations
  resolve: {
    // Prevent duplicate Three.js instances (causes TSL currentStack errors)
    dedupe: ["three"],
    // Explicit alias for dependency scanning
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  optimizeDeps: {
    // Only pre-bundle base three for client
    include: ["three"],
    // Exclude WebGPU from pre-bundling - causes SSR errors
    exclude: ["three/webgpu", "three/tsl"],
  },
  build: {
    // Rolldown uses oxc for minification (Rust-based, fast)
    minify: true,
  },

  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      persistState: true,
    }),
    tsConfigPaths(),
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    viteReact({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tailwindcss(),
    glsl(),
  ],
});
