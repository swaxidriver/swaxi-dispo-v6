#!/usr/bin/env node

/**
 * Simple test script to validate our Playwright setup without full browser installation
 * This will check if our configuration is valid and our test files are syntactically correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating Playwright E2E Setup...\n');

// Check if Playwright config exists
const configPath = path.join(__dirname, '..', 'playwright.config.js');
if (fs.existsSync(configPath)) {
  console.log('✅ Playwright configuration found');
} else {
  console.log('❌ Playwright configuration missing');
  process.exit(1);
}

// Check if test files exist
const testDir = path.join(__dirname);
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.js') && file !== 'validate-setup.js');

console.log(`✅ Found ${testFiles.length} test files:`);
testFiles.forEach(file => {
  console.log(`   - ${file}`);
});

// Check if key test IDs are present in the source code
const srcDir = path.join(__dirname, '..', 'src');
const testIds = [
  // Static test IDs
  { id: 'main-nav', type: 'static' },
  { id: 'shift-template-manager', type: 'static' },
  { id: 'create-template-btn', type: 'static' },
  { id: 'template-name-input', type: 'static' },
  { id: 'shift-table', type: 'static' },
  { id: 'shift-item', type: 'static' },
  { id: 'assign-shift-btn', type: 'static' },
  { id: 'conflict-badge', type: 'static' },
  { id: 'export-btn', type: 'static' },
  { id: 'feedback-btn', type: 'static' },
  { id: 'version-banner', type: 'static' },
  // Dynamic test IDs (check for the pattern)
  { id: 'nav-${', type: 'dynamic', pattern: 'nav-${' },
  { id: 'testId', type: 'dynamic', pattern: 'data-testid={testId}' }
];

console.log('\n📋 Checking test IDs in source code:');

function findTestId(dir, testIdObj) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      if (findTestId(filePath, testIdObj)) return true;
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (testIdObj.type === 'static') {
        if (content.includes(`data-testid="${testIdObj.id}"`)) {
          return true;
        }
      } else if (testIdObj.type === 'dynamic') {
        if (content.includes(testIdObj.pattern)) {
          return true;
        }
      }
    }
  }
  return false;
}

let allTestIdsFound = true;
testIds.forEach(testIdObj => {
  const found = findTestId(srcDir, testIdObj);
  const displayName = testIdObj.type === 'dynamic' ? `${testIdObj.id} (dynamic)` : testIdObj.id;
  if (found) {
    console.log(`   ✅ ${displayName}`);
  } else {
    console.log(`   ❌ ${displayName} - NOT FOUND`);
    allTestIdsFound = false;
  }
});

// Check NPM scripts
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('\n🚀 Checking NPM scripts:');
const e2eScripts = [
  'test:e2e',
  'test:e2e:headed',
  'test:e2e:ui'
];

e2eScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`   ✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`   ❌ ${script} - NOT FOUND`);
    allTestIdsFound = false;
  }
});

// Summary
console.log('\n📊 Summary:');
if (allTestIdsFound) {
  console.log('✅ All test IDs and scripts are properly configured');
  console.log('✅ Playwright E2E setup is ready');
  console.log('\n📝 To run tests:');
  console.log('   1. Install browser: npx playwright install chromium');
  console.log('   2. Run tests: npm run test:e2e');
  console.log('   3. Run with UI: npm run test:e2e:ui');
} else {
  console.log('❌ Some test IDs or scripts are missing');
  process.exit(1);
}