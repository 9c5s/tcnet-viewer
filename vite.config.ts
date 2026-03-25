import { defineConfig, loadEnv } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { tcnetPlugin } from "./server/index.ts";

export default defineConfig(({ mode }) => {
  // .envファイルをprocess.envにロードする
  // 第3引数の''で全変数を読み込む (VITE_プレフィックス不要)
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    staged: {
      "*": ["bash -c '! git check-ignore'", "vp check --fix", "vp lint --deny-warnings"],
      "*.svelte": ["vp dlx eslint --fix", "vp dlx svelte-check --fail-on-warnings"],
      ".github/workflows/*.{yml,yaml}": ["vp dlx actionlint", "vp dlx zizmor --fix --pedantic"],
    },
    plugins: [tailwindcss(), svelte(), tcnetPlugin()],
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
    test: {
      include: ["tests/**/*.test.ts"],
      environmentMatchGlobs: [
        ["tests/parsers/**", "node"],
        ["tests/utils/**", "node"],
        ["tests/lib/**", "jsdom"],
      ],
    },
  };
});
