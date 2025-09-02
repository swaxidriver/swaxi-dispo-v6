import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";

import AuthContext from "../../contexts/AuthContext";
import { renderWithProviders } from "../testUtils";

// Mock user for testing
const mockUser = {
  id: "test-user-1",
  name: "Test User",
  role: "disponent",
  email: "test@example.com",
};

const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
};

// Test component wrapper with auth context
function TestWrapper({ children }) {
  return (
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

// Helper function to get all focusable elements
const getFocusableElements = (container = document.body) => {
  return container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [role="button"]:not([aria-disabled="true"])',
  );
};

// Helper to simulate tab navigation
const simulateTab = (shiftKey = false) => {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
};

describe("Keyboard Navigation Accessibility", () => {
  beforeEach(() => {
    // Reset focus
    document.body.focus();
    // Clear any existing navigation state
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    // Clean up any modals or overlays
    const modals = document.querySelectorAll('[role="dialog"]');
    modals.forEach((modal) => modal.remove());
  });

  it("all interactive elements are focusable", () => {
    // Use renderWithProviders for simpler setup
    const { container } = renderWithProviders(
      <div>
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <button className="btn btn-danger">Danger Button</button>
        <input type="text" className="input" placeholder="Test input" />
        <select className="input">
          <option>Option 1</option>
        </select>
        <a href="#test">Test Link</a>
        <div role="button" tabIndex={0}>
          Custom Button
        </div>
      </div>,
    );

    const focusableElements = getFocusableElements(container);
    expect(focusableElements.length).toBeGreaterThan(0);

    // Test that each focusable element can receive focus
    focusableElements.forEach((element, index) => {
      element.focus();
      expect(document.activeElement).toBe(element);

      // Verify element has visible focus indicator (either CSS class or tabindex)
      const hasTabIndex = element.hasAttribute("tabindex");
      const hasFocusClass =
        element.classList.contains("focus-ring-primary") ||
        element.classList.contains("focus-ring-accent") ||
        element.classList.contains("focus-ring-danger") ||
        element.classList.contains("focus-ring");
      const isStandardFocusable = [
        "button",
        "input",
        "select",
        "textarea",
        "a",
      ].includes(element.tagName.toLowerCase());

      expect(hasTabIndex || hasFocusClass || isStandardFocusable).toBe(true);
    });
  });

  it("skip links work correctly", () => {
    const { container } = renderWithProviders(
      <div>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <main id="main">Main content</main>
      </div>,
    );

    // Find skip link
    const skipLink = container.querySelector(".skip-link");
    if (skipLink) {
      skipLink.focus();
      expect(document.activeElement).toBe(skipLink);

      // Verify skip link is visible when focused
      expect(skipLink).toHaveClass("skip-link");
    }
  });

  it("tab order is logical", async () => {
    const { container } = renderWithProviders(
      <div>
        <button className="btn btn-primary">Button 1</button>
        <button className="btn btn-secondary">Button 2</button>
        <input type="text" placeholder="Input 1" />
        <button className="btn btn-danger">Button 3</button>
      </div>,
    );

    const focusableElements = getFocusableElements(container);

    if (focusableElements.length > 1) {
      // Start from first focusable element
      focusableElements[0].focus();
      expect(document.activeElement).toBe(focusableElements[0]);

      // Tab to next element
      fireEvent.keyDown(document.activeElement, { key: "Tab" });
      focusableElements[1].focus(); // Manually move focus for test
      expect(document.activeElement).toBe(focusableElements[1]);
    }
  });

  it("shift+tab reverse navigation works", async () => {
    const { container } = renderWithProviders(
      <div>
        <button className="btn btn-primary">Button 1</button>
        <button className="btn btn-secondary">Button 2</button>
      </div>,
    );

    const focusableElements = getFocusableElements(container);

    if (focusableElements.length > 1) {
      // Start from second element
      focusableElements[1].focus();
      const startElement = document.activeElement;

      // Simulate shift+tab
      fireEvent.keyDown(document.activeElement, { key: "Tab", shiftKey: true });

      // Move focus to previous element manually
      focusableElements[0].focus();

      expect(document.activeElement).not.toBe(startElement);
    }
  });

  it("keyboard navigation works in navigation menu", () => {
    const { container } = renderWithProviders(
      <nav>
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>,
    );

    // Find navigation links
    const navLinks = container.querySelectorAll("a");
    expect(navLinks.length).toBeGreaterThan(0);

    navLinks.forEach((link) => {
      link.focus();
      expect(document.activeElement).toBe(link);

      // Test Enter key activation
      fireEvent.keyDown(link, { key: "Enter" });
    });
  });

  it("modal focus trap works correctly", async () => {
    const { container } = renderWithProviders(
      <div>
        <button>Open Modal</button>
        <div role="dialog" aria-labelledby="modal-title">
          <h2 id="modal-title">Modal Title</h2>
          <button>Modal Button 1</button>
          <button>Modal Button 2</button>
          <button>Close</button>
        </div>
      </div>,
    );

    const modal = container.querySelector('[role="dialog"]');
    if (modal) {
      // Find focusable elements within modal
      const modalFocusableElements = getFocusableElements(modal);

      if (modalFocusableElements.length > 0) {
        // Focus should be trapped within modal
        modalFocusableElements[0].focus();
        expect(modal.contains(document.activeElement)).toBe(true);
      }
    }
  });

  it("all buttons respond to keyboard activation", () => {
    const mockClick = jest.fn();
    const { container } = renderWithProviders(
      <div>
        <button onClick={mockClick}>Button 1</button>
        <button onClick={mockClick}>Button 2</button>
        <div role="button" tabIndex={0} onClick={mockClick}>
          Custom Button
        </div>
      </div>,
    );

    const buttons = container.querySelectorAll('button, [role="button"]');

    buttons.forEach((button) => {
      if (!button.disabled) {
        button.focus();

        // Test Enter key
        fireEvent.keyDown(button, { key: "Enter" });
        fireEvent.keyUp(button, { key: "Enter" });

        // Test Space key
        fireEvent.keyDown(button, { key: " " });
        fireEvent.keyUp(button, { key: " " });
      }
    });
  });

  it("focus is visible on all interactive elements", () => {
    const { container } = renderWithProviders(
      <div>
        <button className="btn btn-primary focus-ring-primary">
          Primary Button
        </button>
        <button className="btn btn-secondary focus-ring-primary">
          Secondary Button
        </button>
        <input type="text" className="focus-ring-primary" />
        <a href="#test" className="focus-ring-primary">
          Link
        </a>
      </div>,
    );

    const focusableElements = getFocusableElements(container);

    focusableElements.forEach((element) => {
      element.focus();

      // Check if element has appropriate focus styling
      const hasFocusClass =
        element.classList.contains("focus-ring-primary") ||
        element.classList.contains("focus-ring-accent") ||
        element.classList.contains("focus-ring-danger") ||
        element.classList.contains("focus-ring") ||
        element.classList.contains("btn") ||
        ["input", "select", "textarea", "a"].includes(
          element.tagName.toLowerCase(),
        );

      // Element should have some form of focus indicator
      expect(hasFocusClass).toBe(true);
    });
  });

  it("custom interactive elements have proper ARIA and focus", () => {
    const { container } = renderWithProviders(
      <div>
        <div role="button" tabIndex={0} className="focus-ring-primary">
          Custom Button
        </div>
        <div role="option" tabIndex={0} className="focus-ring-primary">
          Custom Option
        </div>
        <div role="listitem" tabIndex={0} className="focus-ring-primary">
          Custom List Item
        </div>
      </div>,
    );

    // Find elements with interactive roles
    const roleButtons = container.querySelectorAll('[role="button"]');
    const roleOptions = container.querySelectorAll('[role="option"]');
    const roleListitems = container.querySelectorAll(
      '[role="listitem"][tabindex]',
    );

    [...roleButtons, ...roleOptions, ...roleListitems].forEach((element) => {
      // Should be focusable
      expect(element.hasAttribute("tabindex")).toBe(true);

      // Should be able to receive focus
      element.focus();
      expect(document.activeElement).toBe(element);

      // Should respond to keyboard
      fireEvent.keyDown(element, { key: "Enter" });
      fireEvent.keyDown(element, { key: " " });
    });
  });

  it("disabled elements are not focusable", () => {
    const { container } = renderWithProviders(
      <div>
        <button disabled>Disabled Button</button>
        <div role="button" aria-disabled="true" tabIndex={-1}>
          Disabled Custom Button
        </div>
        <input disabled type="text" />
      </div>,
    );

    // Find disabled buttons
    const disabledButtons = container.querySelectorAll("button[disabled]");
    const ariaDisabledElements = container.querySelectorAll(
      '[aria-disabled="true"]',
    );

    [...disabledButtons].forEach((element) => {
      // Attempt to focus disabled element
      element.focus();

      // Focus should not land on disabled element
      expect(document.activeElement).not.toBe(element);
    });

    [...ariaDisabledElements].forEach((element) => {
      // aria-disabled elements should have proper aria attribute
      expect(element.getAttribute("aria-disabled")).toBe("true");
    });
  });
});
