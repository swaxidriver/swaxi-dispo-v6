import { promises as fs } from 'fs';
import path from 'path';

describe('Design Tokens Stability', () => {
  test('tokens.json snapshot remains stable', async () => {
    const tokensPath = path.join(process.cwd(), 'src', 'tokens.json');
    
    // Read the generated tokens.json
    const tokensContent = await fs.readFile(tokensPath, 'utf8');
    const tokens = JSON.parse(tokensContent);
    
    // Remove volatile metadata that changes on each generation
    const stableTokens = {
      ...tokens,
      meta: {
        source: tokens.meta.source,
        version: tokens.meta.version
        // Exclude 'generated' timestamp as it changes each time
      }
    };
    
    // Snapshot test to ensure tokens structure and values remain stable
    expect(stableTokens).toMatchSnapshot();
  });
  
  test('tokens.json contains required token categories', async () => {
    const tokensPath = path.join(process.cwd(), 'src', 'tokens.json');
    const tokensContent = await fs.readFile(tokensPath, 'utf8');
    const tokens = JSON.parse(tokensContent);
    
    // Verify structure
    expect(tokens).toHaveProperty('light');
    expect(tokens).toHaveProperty('dark');
    expect(tokens).toHaveProperty('meta');
    
    // Verify light theme has required categories
    expect(tokens.light).toHaveProperty('colors');
    expect(tokens.light).toHaveProperty('typography');
    expect(tokens.light).toHaveProperty('radii');
    expect(tokens.light).toHaveProperty('shadows');
    
    // Verify we have essential color tokens
    expect(tokens.light.colors).toHaveProperty('color-primary');
    expect(tokens.light.colors).toHaveProperty('color-bg');
    expect(tokens.light.colors).toHaveProperty('color-surface');
    expect(tokens.light.colors).toHaveProperty('color-text');
    
    // Verify we have typography tokens
    expect(tokens.light.typography).toHaveProperty('font-sans');
    expect(tokens.light.typography).toHaveProperty('font-mono');
    
    // Verify we have radius tokens
    expect(tokens.light.radii).toHaveProperty('radius-sm');
    expect(tokens.light.radii).toHaveProperty('radius-md');
    expect(tokens.light.radii).toHaveProperty('radius-lg');
    
    // Verify dark theme has color overrides
    expect(tokens.dark.colors).toHaveProperty('color-primary');
    expect(tokens.dark.colors).toHaveProperty('color-bg');
    expect(tokens.dark.colors).toHaveProperty('color-surface');
  });
  
  test('tokens.json matches CSS variables count', async () => {
    const tokensPath = path.join(process.cwd(), 'src', 'tokens.json');
    const cssPath = path.join(process.cwd(), 'src', 'styles', 'tokens.css');
    
    const tokensContent = await fs.readFile(tokensPath, 'utf8');
    const cssContent = await fs.readFile(cssPath, 'utf8');
    const tokens = JSON.parse(tokensContent);
    
    // Count CSS variables in :root
    const rootVariables = (cssContent.match(/:root\s*\{[^}]*\}/s)?.[0].match(/--[\w-]+:/g) || []).length;
    
    // Count tokens in light theme
    const lightTokenCount = Object.keys(tokens.light.colors).length + 
                           Object.keys(tokens.light.typography).length + 
                           Object.keys(tokens.light.radii).length + 
                           Object.keys(tokens.light.shadows).length;
    
    expect(lightTokenCount).toBe(rootVariables);
  });
});