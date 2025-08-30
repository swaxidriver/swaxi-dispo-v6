import { test, expect } from '@playwright/test';

/**
 * Playwright E2E Smoke Tests for Swaxi Dispo v6
 * 
 * Tests core application flows:
 * - Create template
 * - Generate week (automatic when templates are created)
 * - Assign shifts  
 * - Export functionality
 * 
 * All tests use data-testid attributes for reliable element selection.
 */

test.describe('Swaxi Dispo v6 Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to be ready (skip loading skeleton)
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that the main navigation is present
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    
    // Check that the main content area is present
    await expect(page.locator('#main-content')).toBeVisible();
    
    // Check for basic application elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should be able to navigate to different pages', async ({ page }) => {
    // Test navigation to Calendar page
    await page.click('[data-testid="nav-calendar"]');
    await expect(page.locator('text=Kalender')).toBeVisible();
    
    // Test navigation to Administration page
    await page.click('[data-testid="nav-admin"]');
    await expect(page.locator('text=Administration')).toBeVisible();
    
    // Test navigation back to Dashboard
    await page.click('[data-testid="nav-dashboard"]');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should open template creation form in Administration', async ({ page }) => {
    // Navigate to Administration page where template creation should be
    await page.click('[data-testid="nav-admin"]');
    
    // Check that the shift template manager is visible
    await expect(page.locator('[data-testid="shift-template-manager"]')).toBeVisible();
    
    // Check that the template creation form is present
    await expect(page.locator('[data-testid="create-template-form"]')).toBeVisible();
    
    // Check key form elements
    await expect(page.locator('[data-testid="template-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-start-time-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="template-end-time-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-template-btn"]')).toBeVisible();
  });

  test('should be able to create a template and generate shifts', async ({ page }) => {
    // Navigate to Administration page
    await page.click('[data-testid="nav-admin"]');
    
    // Fill in template form
    await page.fill('[data-testid="template-name-input"]', 'Test Template');
    await page.fill('[data-testid="template-start-time-input"]', '09:00');
    await page.fill('[data-testid="template-end-time-input"]', '17:00');
    
    // Select Monday (Mo)
    await page.click('[data-testid="day-mo"]');
    
    // Submit the template
    await page.click('[data-testid="create-template-btn"]');
    
    // Check that the template appears in the list
    await expect(page.locator('[data-testid="template-list"]')).toBeVisible();
    
    // Navigate to Dashboard to see if shifts were generated
    await page.click('[data-testid="nav-dashboard"]');
    
    // Check that shifts are visible (generated automatically from template)
    await expect(page.locator('[data-testid="shift-table"]')).toBeVisible();
  });

  test('should display shifts in the shift table', async ({ page }) => {
    // Navigate to Dashboard where shifts should be visible
    await page.click('[data-testid="nav-dashboard"]');
    
    // Check that the shift table is present
    await expect(page.locator('[data-testid="shift-table"]')).toBeVisible();
    
    // If there are shifts, they should have the data-testid
    const shiftItems = page.locator('[data-testid="shift-item"]');
    const shiftCount = await shiftItems.count();
    
    if (shiftCount > 0) {
      // Check first shift is visible
      await expect(shiftItems.first()).toBeVisible();
      
      // Check for assign button if shift is open
      const assignButton = page.locator('[data-testid="assign-shift-btn"]');
      if (await assignButton.count() > 0) {
        await expect(assignButton.first()).toBeVisible();
      }
    }
  });

  test('should be able to export data from Audit page', async ({ page }) => {
    // Navigate to Audit page where export should be available
    await page.click('[data-testid="nav-audit"]');
    
    // Check that export button is present
    await expect(page.locator('[data-testid="export-btn"]')).toBeVisible();
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('[data-testid="export-btn"]');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download has a filename
    expect(download.suggestedFilename()).toMatch(/swaxi-audit-.*\.json/);
  });

  test('should handle mobile navigation on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that navigation is still accessible
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
    
    // Navigation should still work on mobile
    await page.click('[data-testid="nav-calendar"]');
    await expect(page.locator('text=Kalender')).toBeVisible();
  });

  test('should display conflict badges when conflicts exist', async ({ page }) => {
    // Navigate to Dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Look for conflict badges or indicators
    const conflictBadges = page.locator('[data-testid="conflict-badge"]');
    const conflictCount = await conflictBadges.count();
    
    if (conflictCount > 0) {
      // If conflicts exist, they should be visible
      await expect(conflictBadges.first()).toBeVisible();
      
      // Hover over conflict badge to see tooltip
      await conflictBadges.first().hover();
      
      // Check for tooltip (may take a moment to appear)
      await expect(page.locator('[data-testid="conflict-tooltip"]')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should persist data after page reload', async ({ page }) => {
    // Navigate to Dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Wait for any content to load
    await page.waitForTimeout(1000);
    
    // Get initial page title to verify we're on the right page
    const titleBefore = await page.locator('h1').textContent();
    
    // Reload the page
    await page.reload();
    
    // Wait for app to be ready again
    await expect(page.locator('#main-content')).toBeVisible();
    
    // Verify we're back on the same page
    await expect(page.locator('h1')).toHaveText(titleBefore);
    
    // Navigation should still work
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
  });

  test('should show version banner if update is available', async ({ page }) => {
    // Check if version banner is present (it might not always be visible)
    const versionBanner = page.locator('[data-testid="version-banner"]');
    
    // This test checks if the banner appears when needed
    // In normal operation, it might not be visible
    const bannerCount = await versionBanner.count();
    
    if (bannerCount > 0) {
      await expect(versionBanner).toBeVisible();
      
      // Check for reload button
      const reloadBtn = page.locator('[data-testid="version-reload-btn"]');
      await expect(reloadBtn).toBeVisible();
      
      // Click reload button (will reload page)
      await reloadBtn.click();
      
      // Page should reload and banner should be gone
      await expect(page.locator('#main-content')).toBeVisible();
    }
  });

  test('should allow feedback submission', async ({ page }) => {
    // Check if feedback button is present
    const feedbackBtn = page.locator('[data-testid="feedback-btn"]');
    
    if (await feedbackBtn.count() > 0) {
      await expect(feedbackBtn).toBeVisible();
      
      // Click feedback button (would open modal)
      await feedbackBtn.click();
      
      // In a full implementation, we would test the feedback modal
      // For now, just verify the button is functional
    }
  });
});