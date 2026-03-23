import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import svelteParser from "svelte-eslint-parser";
import tsParser from "@typescript-eslint/parser";

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
          ["error", { entryPoint: "src/app.css" }],
        ]),
      ),
      // @plugin "daisyui" および @layer components のカスタムクラスを認識できないため無効化
      "better-tailwindcss/no-unknown-classes": "off",
      // 行折り返し: 120文字超で折り返し、収まるなら1行にまとめる
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "error",
        { entryPoint: "src/app.css", printWidth: 120, preferSingleLine: true },
      ],
    },
  },
];
