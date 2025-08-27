#!/usr/bin/env node

// Script to check for non-standard spacing values in JSX/CSS files
// Identifies hardcoded pixel values that should use the spacing scale

const fs = require('fs');
const path = require('path');

// Allowed spacing values that map to our scale
const allowedValues = new Set([
  '4px',   // --space-xs
  '8px',   // --space-sm  
  '12px',  // --space-md
  '16px',  // --space-lg
  '24px',  // --space-xl
  '32px',  // --space-2xl
  '0px',   // neutral
  '1px',   // borders
  '2px',   // small borders/elements
]);

// Common disallowed values that should be replaced
const disallowedValues = [
  '3px', '5px', '6px', '7px', '9px', '10px', '11px', 
  '13px', '14px', '15px', '17px', '18px', '19px', '20px',
  '21px', '22px', '23px', '25px', '26px', '27px', '28px'
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for inline pixel values in style attributes
    const styleRegex = /style=\{[^}]*\}/g;
    let match;
    
    while ((match = styleRegex.exec(content)) !== null) {
      const styleContent = match[0];
      
      // Look for pixel values
      const pixelRegex = /(\d+)px/g;
      let pixelMatch;
      
      while ((pixelMatch = pixelRegex.exec(styleContent)) !== null) {
        const value = pixelMatch[0];
        if (disallowedValues.includes(value.replace('px', '') + 'px')) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            file: filePath,
            line: lineNumber,
            value: value,
            context: styleContent.substring(0, 50) + '...'
          });
        }
      }
    }
    
    // Check for Tailwind classes with disallowed values
    const tailwindRegex = /className="[^"]*"/g;
    while ((match = tailwindRegex.exec(content)) !== null) {
      const className = match[0];
      
      // Look for spacing classes (px-, py-, mx-, my-, etc.)
      const spacingRegex = /(p[xytrbl]?|m[xytrbl]?|space-[xy]|gap)-(\d+)/g;
      let spacingMatch;
      
      while ((spacingMatch = spacingRegex.exec(className)) !== null) {
        const value = parseInt(spacingMatch[2]) * 4; // Tailwind multiplier
        if (disallowedValues.includes(value + 'px')) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          issues.push({
            file: filePath,
            line: lineNumber,
            value: spacingMatch[0],
            context: className.substring(0, 50) + '...'
          });
        }
      }
    }
    
    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dirPath) {
  const results = [];
  
  function scan(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && /\.(jsx?|css)$/.test(item)) {
          const issues = checkFile(fullPath);
          if (issues.length > 0) {
            results.push(...issues);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error.message);
    }
  }
  
  scan(dirPath);
  return results;
}

// Main execution
const targetPath = process.argv[2] || './src';

console.log('🔍 Checking for non-standard spacing values...\n');

let issues = [];

// Check if target is a file or directory
try {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    issues = checkFile(targetPath);
  } else if (stat.isDirectory()) {
    issues = scanDirectory(targetPath);
  }
} catch (error) {
  console.error(`Error accessing ${targetPath}:`, error.message);
  process.exit(1);
}

if (issues.length === 0) {
  console.log('✅ No spacing issues found! All values follow the spacing scale.');
} else {
  console.log('⚠️  Found spacing issues:');
  console.log('='.repeat(50));
  
  for (const issue of issues) {
    console.log(`📄 ${issue.file}:${issue.line}`);
    console.log(`   ❌ "${issue.value}" should use spacing scale`);
    console.log(`   📝 ${issue.context}`);
    console.log('');
  }
  
  console.log(`Total issues: ${issues.length}`);
  console.log('\n💡 Consider replacing with:');
  console.log('   • var(--space-xs) for 4px');
  console.log('   • var(--space-sm) for 8px');
  console.log('   • var(--space-md) for 12px');
  console.log('   • var(--space-lg) for 16px');
  console.log('   • var(--space-xl) for 24px');
  console.log('   • var(--space-2xl) for 32px');
  
  process.exit(1);
}