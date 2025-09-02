#!/usr/bin/env node
/*
 * Token Lint: Scans project for hard-coded hex colors outside approved locations.
 * Allowed files: styles/tokens.css, README.md, CHANGELOG.md, *.scss (temporary), tailwind.config.js
 */
import { promises as fs } from "fs";
import path from "path";
import fg from "fast-glob";

const allowed = new Set([
  "src/styles/tokens.css",
  "README.md",
  "CHANGELOG.md",
  "tailwind.config.js",
]);

const hexRegex = /#[0-9a-fA-F]{3,8}\b/g;

async function run() {
  const entries = await fg(["**/*.{js,jsx,ts,tsx,css,md,scss,html}"], {
    ignore: ["node_modules"],
  });
  const violations = [];
  for (const file of entries) {
    if (allowed.has(file)) continue;
    const content = await fs.readFile(file, "utf8");
    // Ignore data URIs
    const matches = content.match(hexRegex);
    if (matches) {
      // Filter out likely hash IDs (e.g., #root, #app) by ensuring not followed by letter-only sequence length < 9
      const filtered = matches.filter((m) => !/^#([a-zA-Z]{1,9})$/.test(m));
      if (filtered.length) {
        violations.push({ file, colors: [...new Set(filtered)] });
      }
    }
  }
  if (violations.length) {
    console.error(
      "\nHard-coded color hex values detected (use tokens.css variables):",
    );
    for (const v of violations) {
      console.error(` - ${v.file}: ${v.colors.join(", ")}`);
    }
    process.exitCode = 1;
  } else {
    console.log("✅ No raw color hex values found outside approved files.");
  }
}

run();
