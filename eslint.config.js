import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: ["dist/**", "coverage/**"],
  },
  // Node environment overrides (backend scripts, configs, e2e tooling)
  {
    files: [
      "backend/**",
      "playwright.config*.js",
      "e2e/**",
      "scripts/**",
      "vite.config.js",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Import hygiene
      // Temporarily disabled due to false positives in flat config; re-enable after resolver tuning
      "import/no-unresolved": "off",
      "import/named": "off",
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
        },
      ],
      "no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^(React|_)",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["jest.config.js", "jest.setup.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.test.{js,jsx}", "**/*.spec.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
  },
];
