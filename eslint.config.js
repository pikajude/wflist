// @ts-expect-error no @types module for this config
import preact from "eslint-config-preact";
// @ts-expect-error no @types module for this config
import js from "@eslint/js";

import { defineConfig } from "eslint/config";
import tses from "typescript-eslint";

export default defineConfig({
  files: ["**/*.{js,jsx,ts,tsx}"],
  ignores: ["eslint.config.js"],
  extends: [
    preact,
    js.configs.recommended,
    tses.configs.recommendedTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "prefer-const": [
      "error",
      {
        destructuring: "all",
      },
    ],
  },
});
