import { defineConfig, loadEnv } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { tcnetPlugin } from "./server/index.ts";

export default defineConfig(({ mode }) => {
  // .envファイルをprocess.envにロードする
  // 第3引数の''で全変数を読み込む (VITE_プレフィックス不要)
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    staged: {
      "*": ["bash -c '! git check-ignore'", "vp check --fix"],
      ".github/workflows/*.{yml,yaml}": ["npx actionlint", "npx zizmor --fix --pedantic"],
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
  };
});
