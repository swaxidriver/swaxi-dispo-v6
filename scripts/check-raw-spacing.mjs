#!/usr/bin/env node
/*
 * Spacing Lint: Scans project for hard-coded spacing pixel values outside approved locations.
 * Detects non-standard spacing values that should use the spacing scale instead.
 * Allowed values: 4, 8, 12, 16, 24, 32, 64 (corresponding to --space-1 through --space-16)
 */
import { promises as fs } from 'fs';
import fg from 'fast-glob';

const allowed = new Set([
  'src/styles/tokens.css',
  'README.md',
  'CHANGELOG.md',
  'tailwind.config.js',
  'scripts/check-raw-spacing.mjs'
]);

// Standard spacing scale values in pixels
const allowedSpacingValues = new Set(['0', '1', '4', '8', '12', '16', '24', '32', '64']);

// Common fractional values (Tailwind decimals)
const allowedFractionalValues = new Set(['0.5', '1.5', '2.5', '3.5']);

// Regex to find potential spacing pixel values in various contexts
// Matches: padding: 13px, margin-left: 18px, gap: 22px, px-5, py-7, etc.
// Excludes: border values, font sizes, line heights, etc.
const spacingRegex = /(?:(?:padding|margin|gap)(?:-(?:top|left|right|bottom|x|y))?:\s*(\d+)px|[pm][xytlrb]?-(\d+)|space-[xy]?-(\d+))/g;

async function run() {
  const entries = await fg(['**/*.{js,jsx,ts,tsx,css,scss}'], { ignore: ['node_modules', 'dist'] });
  const violations = [];
  
  for (const file of entries) {
    if (allowed.has(file)) continue;
    
    const content = await fs.readFile(file, 'utf8');
    const matches = [];
    let match;
    
    // Reset regex state
    spacingRegex.lastIndex = 0;
    
    while ((match = spacingRegex.exec(content)) !== null) {
      // Extract the pixel value from whichever capture group matched
      const pixelValue = match[1] || match[2] || match[3];
      
      if (pixelValue && !allowedSpacingValues.has(pixelValue) && !allowedFractionalValues.has(pixelValue)) {
        // Check if it's really a spacing context and not something else
        const context = content.slice(Math.max(0, match.index - 20), match.index + match[0].length + 20);
        
        // Skip if it looks like height, width, font-size, line-height, border, or other non-spacing properties
        if (!/(?:height|width|size|weight|line-height|font|border|shadow|z-index|duration|delay|radius|transform|top|left|right|bottom)(?![a-z])/i.test(context)) {
          matches.push({
            value: pixelValue,
            context: match[0],
            fullContext: context.trim()
          });
        }
      }
    }
    
    if (matches.length > 0) {
      violations.push({ file, matches });
    }
  }
  
  if (violations.length) {
    console.error('\nNon-standard spacing values detected (use spacing scale):');
    console.error('Standard scale: 4, 8, 12, 16, 24, 32, 64px (--space-1 through --space-16)\n');
    
    for (const v of violations) {
      console.error(`📄 ${v.file}:`);
      for (const m of v.matches) {
        console.error(`  ❌ ${m.value}px in "${m.context}"`);
        console.error(`     Context: ${m.fullContext}`);
      }
      console.error('');
    }
    
    console.error('💡 Replace with spacing scale variables:');
    console.error('   style={{ padding: "var(--space-4)" }} // 16px');
    console.error('   style={{ margin: "var(--space-2)" }}  // 8px');
    
    process.exitCode = 1;
  } else {
    console.log('✅ No non-standard spacing values found.');
  }
}

run();