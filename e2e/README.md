# E2E Tests with Playwright

This directory contains end-to-end tests for Swaxi Dispo v6 using Playwright.

## Getting Started

### Installation

```bash
npm install
npx playwright install chromium
```

### Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with visible browser (headed)
npm run test:e2e:headed

# Run tests with Playwright UI mode
npm run test:e2e:ui
```

### Manual Testing (with dev server already running)

If you have the development server running on `http://localhost:5174`, you can run tests against it:

```bash
# Start dev server in one terminal
npm run dev

# Run tests in another terminal (using simple config without webServer)
npx playwright test --config=playwright.config.simple.js
```

## Test Structure

### Main Test Files

- `playwright-tests.js` - Main smoke tests covering core application flows
- `screenshot-test.js` - Simple test to verify setup and take screenshots

### Test Coverage

The smoke tests cover these core flows:

1. **Application Loading**
   - Basic navigation and page loading
   - Mobile responsiveness

2. **Template Creation Flow**
   - Navigate to Administration page
   - Fill template creation form
   - Submit template

3. **Shift Generation**
   - Automatic shift generation when templates are created
   - Verify shifts appear in Dashboard

4. **Shift Assignment**
   - View shifts in shift table
   - Test assignment buttons (when available)

5. **Export Functionality**
   - Navigate to Audit page
   - Export data as JSON
   - Verify download

6. **UI Features**
   - Conflict badge display and tooltips
   - Version banner handling
   - Data persistence after page reload
   - Feedback functionality

## Test IDs

All tests use `data-testid` attributes for reliable element selection. Key test IDs include:

### Navigation

- `main-nav` - Main navigation container
- `nav-dashboard`, `nav-calendar`, `nav-admin`, `nav-audit` - Navigation links
- `nav-login`, `nav-logout` - Authentication buttons
- `feedback-btn` - Feedback button

### Template Management

- `shift-template-manager` - Template manager container
- `create-template-form` - Template creation form
- `template-name-input`, `template-start-time-input`, `template-end-time-input` - Form inputs
- `day-mo`, `day-tu`, etc. - Day selection buttons
- `create-template-btn` - Submit button
- `template-list` - Template list container

### Shift Management

- `shift-table` - Shift table container
- `shift-item` - Individual shift rows
- `assign-shift-btn` - Assignment button

### UI Elements

- `conflict-badge`, `conflict-tooltip` - Conflict indicators
- `export-btn` - Export functionality
- `version-banner`, `version-reload-btn` - Version update banner

## Configuration

The Playwright configuration supports:

- **Multiple browsers**: Chromium (default), Firefox, Safari (optional)
- **Mobile testing**: Pixel 5 viewport
- **CI/CD ready**: Automatic retry and headless mode for CI
- **Debugging**: Screenshots, videos, and traces on failure
- **Dev server integration**: Automatic startup and shutdown

## Debugging

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots (on failure)
- Videos (retained on failure)
- Traces (on retry)

### Manual Debugging

```bash
# Run with visible browser for debugging
npm run test:e2e:headed

# Run with Playwright inspector
npx playwright test --debug

# Run specific test file
npx playwright test e2e/playwright-tests.js

# Run specific test
npx playwright test -g "should load the application successfully"
```

### Common Issues

1. **Browser not installed**: Run `npx playwright install chromium`
2. **Dev server not running**: The webServer config will start it automatically, or start manually with `npm run dev`
3. **Port conflicts**: Check if ports 5173/5174 are available
4. **Test timeouts**: Increase timeout in config if tests are slow

## Writing New Tests

When adding new tests:

1. **Use data-testid attributes** for element selection
2. **Follow the existing pattern** of checking element visibility before interaction
3. **Add proper waits** for dynamic content
4. **Handle optional elements** with conditional checks
5. **Test both desktop and mobile** viewports when relevant

Example test structure:

```javascript
test("should perform some action", async ({ page }) => {
  // Navigate
  await page.goto("/");

  // Wait for app to be ready
  await expect(page.locator("#main-content")).toBeVisible();

  // Perform actions
  await page.click('[data-testid="some-button"]');

  // Verify results
  await expect(page.locator('[data-testid="expected-result"]')).toBeVisible();
});
```
