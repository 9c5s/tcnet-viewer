import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import svelteParser from "svelte-eslint-parser";
import tsParser from "@typescript-eslint/parser";

const ENTRY_POINT = "src/app.css";

export default [
  {
    files: ["src/**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
    },
    plugins: {
      "better-tailwindcss": betterTailwindcss,
    },
    rules: {
      ...Object.fromEntries(
        Object.entries(betterTailwindcss.rules).map(([name]) => [
          `better-tailwindcss/${name}`,
          ["error", { entryPoint: ENTRY_POINT }],
        ]),
      ),
      // @plugin "daisyui" と @layer components のカスタムクラスを許可リストで除外
      "better-tailwindcss/no-unknown-classes": [
        "error",
        {
          entryPoint: ENTRY_POINT,
          ignore: [
            "section-title", // @layer components (app.css)
            "status-badge", // @layer components (app.css)
            "dropdown-content", // daisyUI コンポーネント
            "active", // daisyUI 状態クラス
          ],
        },
      ],
      // 行折り返し: 120文字超で折り返し、収まるなら1行にまとめる
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "error",
        { entryPoint: ENTRY_POINT, printWidth: 120, preferSingleLine: true },
      ],
    },
  },
];
