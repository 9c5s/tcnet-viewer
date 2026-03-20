import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { tcnetPlugin } from "./server/index.js";

export default defineConfig({
  plugins: [svelte(), tcnetPlugin()],
  server: {
    port: 5180,
  },
  resolve: {
    alias: {
      "$lib": "/src/lib",
    },
  },
  ssr: {
    // node-tcnetはNode.jsの標準importで解決し、ViteのSSR変換を通さない
    external: ["@s0/node-tcnet"],
  },
});
