#!/usr/bin/env node
// Simple contrast audit for defined light/dark token pairs.
// Formula: (L1 + 0.05) / (L2 + 0.05), where L is relative luminance.

const pairs = [
  { name: "text vs bg (light)", fg: "#0f172a", bg: "#f8fafc", min: 4.5 },
  { name: "muted vs bg (light)", fg: "#64748b", bg: "#f8fafc", min: 3 },
  { name: "primary vs bg (light)", fg: "#222F88", bg: "#f8fafc", min: 4.5 },
  {
    name: "text vs primary button (light)",
    fg: "#ffffff",
    bg: "#222F88",
    min: 4.5,
  },
  { name: "text vs bg (dark)", fg: "#f1f5f9", bg: "#0f172a", min: 4.5 },
  { name: "muted vs bg (dark)", fg: "#94a3b8", bg: "#0f172a", min: 3 },
  { name: "primary vs bg (dark)", fg: "#8094ff", bg: "#0f172a", min: 4.5 },
  // NOTE: Keep this in sync with --color-primary-emphasis in tokens.css
  {
    name: "text vs primary button (dark)",
    fg: "#ffffff",
    bg: "#4f67d2",
    min: 4.5,
  },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function relLum([r, g, b]) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrast(fg, bg) {
  const L1 = relLum(hexToRgb(fg));
  const L2 = relLum(hexToRgb(bg));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

let failed = 0;
for (const p of pairs) {
  const ratio = contrast(p.fg, p.bg);
  const pass = ratio >= p.min;
  console.log(
    `${p.name}: ${ratio.toFixed(2)} ${pass ? "PASS" : "FAIL (<" + p.min + ")"}`,
  );
  if (!pass) failed++;
}

if (failed) {
  console.error(`\nContrast audit failed: ${failed} pair(s) below threshold.`);
  process.exit(1);
} else {
  console.log("\nAll contrast pairs meet thresholds.");
}
