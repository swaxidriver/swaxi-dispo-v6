#!/usr/bin/env node
/*
 * Design Token Export: Parse tokens.css and generate tokens.json
 * Extracts CSS custom properties and organizes them into categorized JSON structure
 * Supports both light and dark theme variants
 */
import { promises as fs } from 'fs';
import path from 'path';

const INPUT_FILE = 'src/styles/tokens.css';
const OUTPUT_FILE = 'src/styles/tokens.json';

/**
 * Parse CSS custom properties from a CSS block
 * @param {string} cssBlock - CSS content within a selector
 * @returns {Object} Object with property names as keys and values
 */
function parseCSSProperties(cssBlock) {
  const properties = {};
  // Updated regex to handle numbers in property names
  const propertyRegex = /--([a-z0-9-]+):\s*([^;]+);/g;
  let match;
  
  while ((match = propertyRegex.exec(cssBlock)) !== null) {
    const [, name, value] = match;
    properties[name] = value.trim();
  }
  
  return properties;
}

/**
 * Categorize tokens based on naming patterns
 * @param {Object} tokens - Raw token object
 * @returns {Object} Categorized tokens
 */
function categorizeTokens(tokens) {
  const categories = {
    colors: {},
    typography: {},
    spacing: {},
    borders: {},
    shadows: {}
  };

  for (const [name, value] of Object.entries(tokens)) {
    if (name.startsWith('color-')) {
      categories.colors[name] = value;
    } else if (name.startsWith('font-') || name.startsWith('text-')) {
      categories.typography[name] = value;
    } else if (name.startsWith('space-')) {
      categories.spacing[name] = value;
    } else if (name.startsWith('radius-')) {
      categories.borders[name] = value;
    } else if (name.startsWith('shadow-')) {
      categories.shadows[name] = value;
    } else {
      // Fallback for uncategorized tokens
      categories[name] = value;
    }
  }

  return categories;
}

/**
 * Parse tokens.css and extract design tokens
 * @param {string} cssContent - CSS file content
 * @returns {Object} Structured token data
 */
function parseTokens(cssContent) {
  const result = {
    meta: {
      generated: new Date().toISOString(),
      source: INPUT_FILE,
      version: '1.0.0'
    },
    light: {},
    dark: {}
  };

  // Extract :root tokens (light theme)
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/s);
  if (rootMatch) {
    const lightTokens = parseCSSProperties(rootMatch[1]);
    result.light = categorizeTokens(lightTokens);
  }

  // Extract [data-theme='dark'] tokens
  const darkMatch = cssContent.match(/\[data-theme=['"]dark['"]\]\s*\{([^}]+)\}/s);
  if (darkMatch) {
    const darkTokens = parseCSSProperties(darkMatch[1]);
    result.dark = categorizeTokens(darkTokens);
  }

  return result;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🎨 Building design tokens...');
    
    // Read the CSS file
    const cssContent = await fs.readFile(INPUT_FILE, 'utf8');
    
    // Parse and structure tokens
    const tokens = parseTokens(cssContent);
    
    // Write JSON output
    const jsonOutput = JSON.stringify(tokens, null, 2);
    await fs.writeFile(OUTPUT_FILE, jsonOutput, 'utf8');
    
    console.log(`✅ Design tokens exported to ${OUTPUT_FILE}`);
    console.log(`   Light theme tokens: ${Object.keys(tokens.light).length} categories`);
    console.log(`   Dark theme tokens: ${Object.keys(tokens.dark).length} categories`);
    
    // Summary of extracted tokens
    const lightColorCount = Object.keys(tokens.light.colors || {}).length;
    const darkColorCount = Object.keys(tokens.dark.colors || {}).length;
    const typographyCount = Object.keys(tokens.light.typography || {}).length;
    const spacingCount = Object.keys(tokens.light.spacing || {}).length;
    
    console.log(`   Colors: ${lightColorCount} light, ${darkColorCount} dark`);
    console.log(`   Typography: ${typographyCount} tokens`);
    console.log(`   Spacing: ${spacingCount} tokens`);
    
  } catch (error) {
    console.error('❌ Error building tokens:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { parseTokens, categorizeTokens };