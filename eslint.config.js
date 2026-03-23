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
    rules: Object.fromEntries(
      Object.entries(betterTailwindcss.rules).map(([name]) => [
        `better-tailwindcss/${name}`,
        ["error", { entryPoint: "src/app.css" }],
      ]),
    ),
  },
];
