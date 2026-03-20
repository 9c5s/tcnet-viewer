import { defineConfig } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { tcnetPlugin } from "./server/index.ts";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  plugins: [svelte(), tcnetPlugin()],
  server: {
    port: 5180,
  },
  resolve: {
    alias: {
      $lib: "/src/lib",
    },
  },
  ssr: {
    // node-tcnetはNode.jsの標準importで解決し、ViteのSSR変換を通さない
    external: ["@9c5s/node-tcnet"],
  },
});
