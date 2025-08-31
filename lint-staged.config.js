export default {
  // Run ESLint on staged JavaScript/JSX files
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],

  // Run Prettier on other staged files
  "*.{json,md,css,scss,html}": ["prettier --write"],

  // Type check TypeScript files (if any)
  "*.{ts,tsx}": ["tsc --noEmit", "eslint --fix", "prettier --write"],
};
