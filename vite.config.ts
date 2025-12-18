// vite.config.ts
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
  },
  optimizeDeps: {
    // Pre-bundle Three.js for faster dev startup
    include: ["three", "three/webgpu", "three/tsl"],
  },
  build: {
    // Use terser for better Three.js TSL compatibility than esbuild
    minify: "terser",
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
