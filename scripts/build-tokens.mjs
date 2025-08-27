#!/usr/bin/env node
/**
 * Design Token Export Script
 * Parses src/styles/tokens.css and generates src/tokens.json
 * Extracts CSS custom properties for colors, typography, radii, shadows
 */
import { promises as fs } from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const tokensPath = path.join(projectRoot, 'src', 'styles', 'tokens.css');
const outputPath = path.join(projectRoot, 'src', 'tokens.json');

/**
 * Parse CSS custom properties from a CSS rule block
 */
function parseCustomProperties(cssBlock) {
  const properties = {};
  const lines = cssBlock.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Match CSS custom property declarations: --property-name: value;
    const match = trimmed.match(/^--([a-zA-Z0-9-]+):\s*([^;]+);?/);
    if (match) {
      const [, name, value] = match;
      properties[name] = value.trim();
    }
  }
  
  return properties;
}

/**
 * Parse tokens.css and extract light and dark theme tokens
 */
async function parseTokensCSS() {
  const cssContent = await fs.readFile(tokensPath, 'utf8');
  
  // Extract :root block (light theme)
  const rootMatch = cssContent.match(/:root\s*\{([^}]*)\}/s);
  const lightTokens = rootMatch ? parseCustomProperties(rootMatch[1]) : {};
  
  // Extract [data-theme='dark'] block (dark theme)
  const darkMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/s);
  const darkTokens = darkMatch ? parseCustomProperties(darkMatch[1]) : {};
  
  return { lightTokens, darkTokens };
}

/**
 * Categorize tokens by type
 */
function categorizeTokens(tokens) {
  const categorized = {
    colors: {},
    typography: {},
    spacing: {},
    radii: {},
    shadows: {}
  };
  
  for (const [name, value] of Object.entries(tokens)) {
    if (name.startsWith('color-')) {
      categorized.colors[name] = value;
    } else if (name.startsWith('font-') || name.startsWith('text-')) {
      categorized.typography[name] = value;
    } else if (name.startsWith('radius-')) {
      categorized.radii[name] = value;
    } else if (name.startsWith('shadow-')) {
      categorized.shadows[name] = value;
    } else {
      // Handle other spacing or misc tokens
      categorized.spacing[name] = value;
    }
  }
  
  return categorized;
}

/**
 * Generate tokens JSON structure
 */
async function generateTokensJSON() {
  const { lightTokens, darkTokens } = await parseTokensCSS();
  
  const tokens = {
    light: categorizeTokens(lightTokens),
    dark: categorizeTokens(darkTokens),
    meta: {
      source: 'src/styles/tokens.css',
      generated: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  
  return tokens;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🎨 Building design tokens...');
    
    const tokens = await generateTokensJSON();
    
    // Write tokens.json with pretty formatting
    await fs.writeFile(outputPath, JSON.stringify(tokens, null, 2), 'utf8');
    
    console.log(`✅ Tokens exported to ${outputPath}`);
    console.log(`📊 Generated ${Object.keys(tokens.light.colors).length} color tokens`);
    console.log(`📝 Generated ${Object.keys(tokens.light.typography).length} typography tokens`);
    console.log(`📐 Generated ${Object.keys(tokens.light.radii).length} radius tokens`);
    console.log(`🎭 Generated ${Object.keys(tokens.light.shadows).length} shadow tokens`);
    
  } catch (error) {
    console.error('❌ Error building tokens:', error.message);
    process.exit(1);
  }
}

main();