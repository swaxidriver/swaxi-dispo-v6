#!/usr/bin/env node
/**
 * Quality gate runner:
 * 1. Runs ESLint (JSON format)
 * 2. Runs Jest with JSON + coverage summary
 * 3. Aggregates & prints a prioritized action list (tests -> lint -> near-threshold coverage)
 * Exit code mirrors highest severity (fail when tests or lint errors present or coverage below threshold).
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const reportsDir = path.join(projectRoot, "reports", "quality");
mkdirSync(reportsDir, { recursive: true });

function run(cmd, desc) {
  try {
    const res = execSync(cmd, { stdio: "pipe" });
    return res.toString();
  } catch (e) {
    // Still return stdout/stderr for parsing; caller inspects
    return e.stdout?.toString() || "";
  }
}

// 1. ESLint (use json output)
const eslintTmp = path.join(reportsDir, "eslint.json");
run(`npx eslint . -f json > ${eslintTmp} 2>/dev/null`, "eslint");
let eslintResults = [];
if (existsSync(eslintTmp)) {
  try {
    eslintResults = JSON.parse(readFileSync(eslintTmp, "utf8"));
  } catch {
    /* ignore */
  }
}
const lintErrors = [];
const lintErrorByRule = {};
for (const file of eslintResults) {
  for (const m of file.messages) {
    if (m.severity === 2) {
      lintErrors.push({
        filePath: file.filePath,
        ruleId: m.ruleId,
        message: m.message,
        line: m.line,
      });
      const ruleId = m.ruleId || "unknown";
      lintErrorByRule[ruleId] = (lintErrorByRule[ruleId] || 0) + 1;
    }
  }
}

// 2. Jest (JSON + coverage summary). We run once; rely on existing jest.config thresholds.
const jestJson = path.join(reportsDir, "jest-results.json");
const jestCmd = [
  "npx",
  "jest",
  "--ci",
  "--json",
  `--outputFile=${jestJson}`,
  "--coverage",
  "--coverageReporters=json-summary",
  "--reporters=default",
  "--reporters=summary",
];
const jestRun = spawnSync(jestCmd[0], jestCmd.slice(1), { stdio: "inherit" });
let jestData = {};
if (existsSync(jestJson)) {
  try {
    jestData = JSON.parse(readFileSync(jestJson, "utf8"));
  } catch {
    /* ignore */
  }
}

// More efficient failing tests extraction
const failingTests = [];
if (jestData.testResults) {
  for (const tr of jestData.testResults) {
    for (const a of tr.assertionResults) {
      if (a.status === "failed") {
        failingTests.push({ fullName: a.fullName, file: tr.name });
      }
    }
  }
}

// 3. Coverage near-threshold detection (use global thresholds from jest.config.js heuristically)
let thresholds = { statements: 0, branches: 0, functions: 0, lines: 0 };
try {
  const jestConfigSource = readFileSync(
    path.join(projectRoot, "jest.config.js"),
    "utf8",
  );
  // More efficient regex with non-greedy matching and improved pattern
  const match = jestConfigSource.match(
    /coverageThreshold:\s*{\s*global:\s*{\s*([^}]+)\s*}/s,
  );
  if (match) {
    const objText =
      "{" +
      match[1] +
      "}"
        // More efficient cleanup: combine regex operations and handle edge cases
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/(\w+):/g, '"$1":'); // Quote unquoted keys

    // Use Function constructor for safer evaluation
    thresholds = Function("return " + cleaned)();
  }
} catch {
  /* ignore */
}

let coverageSummary = {};
const covSummaryPath = path.join(
  projectRoot,
  "coverage",
  "coverage-summary.json",
);
if (existsSync(covSummaryPath)) {
  try {
    coverageSummary = JSON.parse(readFileSync(covSummaryPath, "utf8"));
  } catch {
    /* ignore */
  }
}

const globalCov = coverageSummary.total || {};
function pct(v) {
  return typeof v?.pct === "number" ? v.pct : null;
}
const nearThreshold = [];
for (const key of ["statements", "branches", "functions", "lines"]) {
  const val = pct(globalCov[key]);
  if (val != null && thresholds[key] != null) {
    const diff = val - thresholds[key];
    if (diff >= 0 && diff <= 2)
      nearThreshold.push({
        metric: key,
        value: val,
        threshold: thresholds[key],
        delta: +diff.toFixed(2),
      });
    if (diff < 0)
      nearThreshold.push({
        metric: key,
        value: val,
        threshold: thresholds[key],
        delta: diff,
        below: true,
      });
  }
}

// Prioritization logic
// 1. Failing tests
// 2. Lint errors (group by rule occurrences)
// 3. Coverage below threshold
// 4. Coverage barely above threshold

const actionItems = [];
if (failingTests.length) {
  for (const f of failingTests)
    actionItems.push({
      priority: 1,
      type: "test-failure",
      test: f.fullName,
      file: f.file,
    });
}

const sortedLintRules = Object.entries(lintErrorByRule).sort(
  (a, b) => b[1] - a[1],
);
for (const [rule, count] of sortedLintRules)
  actionItems.push({ priority: 2, type: "lint-rule", rule, count });

for (const cov of nearThreshold.filter((c) => c.below))
  actionItems.push({ priority: 3, type: "coverage-below", ...cov });
for (const cov of nearThreshold.filter((c) => !c.below && c.delta <= 2))
  actionItems.push({ priority: 4, type: "coverage-near", ...cov });

const summary = {
  stats: {
    tests: {
      total: jestData.numTotalTests,
      failed: jestData.numFailedTests,
      passed: jestData.numPassedTests,
    },
    suites: {
      total: jestData.numTotalTestSuites,
      failed: jestData.numFailedTestSuites,
    },
    lint: {
      errors: lintErrors.length,
      filesWithErrors: new Set(lintErrors.map((e) => e.filePath)).size,
    },
    coverage: Object.fromEntries(
      ["statements", "branches", "functions", "lines"].map((k) => [
        k,
        pct(globalCov[k]),
      ]),
    ),
  },
  thresholds,
  actionItems,
};

writeFileSync(
  path.join(reportsDir, "quality-summary.json"),
  JSON.stringify(summary, null, 2),
);

// Human readable output
function formatAction(a) {
  switch (a.type) {
    case "test-failure":
      return `❌ Test failed: ${a.test} (${a.file})`;
    case "lint-rule":
      return `⚠️  Lint rule ${a.rule} (${a.count} errors)`;
    case "coverage-below":
      return `🔴 Coverage BELOW threshold: ${a.metric} ${a.value}% < ${a.threshold}% (Δ ${a.delta})`;
    case "coverage-near":
      return `🟡 Coverage near threshold: ${a.metric} ${a.value}% (threshold ${a.threshold}%, buffer ${a.delta})`;
    default:
      return JSON.stringify(a);
  }
}

console.log("\n=== QUALITY SUMMARY ===");
console.log(
  `Tests: ${summary.stats.tests.passed}/${summary.stats.tests.total} passed | Suites failed: ${summary.stats.suites.failed}`,
);
console.log(`Lint errors: ${summary.stats.lint.errors}`);
console.log(
  "Coverage:",
  Object.entries(summary.stats.coverage)
    .map(([k, v]) => `${k}:${v}%`)
    .join(" "),
);
if (!actionItems.length) console.log("✅ No prioritized issues. Great job!");
else {
  console.log("\nPrioritized actions:");
  actionItems.forEach((a, i) => console.log(`${i + 1}. ${formatAction(a)}`));
}

// Exit code: 0 if no failures; 1 if tests failed or coverage below; 2 if only lint errors; 0 otherwise.
const hasTestFail = failingTests.length > 0;
const hasCoverageBelow = actionItems.some((a) => a.type === "coverage-below");
const hasLintErrors = lintErrors.length > 0;
if (hasTestFail || hasCoverageBelow) process.exit(1);
if (hasLintErrors) process.exit(2);
process.exit(0);
