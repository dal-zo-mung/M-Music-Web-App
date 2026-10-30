import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

const tsFiles = ["**/*.{ts,tsx,mts,cts}"];

export default [
  {
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "dist-electron/**",
      "dist-ssr/**",
      "release/**",
      "coverage/**",
      "vendor/**",
      "public/**",
      ".kilo/**",
    ],
  },
  js.configs.recommended,
  ...tsPlugin.configs["flat/recommended"].map((config) => ({ ...config, files: tsFiles })),
  {
    languageOptions: { globals: { ...globals.node, ...globals.bun } },
  },
  {
    files: ["src/**/*.{ts,tsx}", "client/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/test/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.vitest, ...globals.browser } },
  },
  {
    files: tsFiles,
    rules: {
      // Introduce stricter typing gradually without blocking existing integrations and test mocks.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: { "react-hooks/rules-of-hooks": "error", "react-hooks/exhaustive-deps": "warn" },
  },
];
