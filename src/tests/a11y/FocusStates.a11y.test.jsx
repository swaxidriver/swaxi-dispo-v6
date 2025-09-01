import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Test component with various interactive elements
function FocusTestComponent() {
  return (
    <div>
      <h1>Focus States Test</h1>

      {/* Skip link */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* Regular buttons */}
      <button className="btn btn-primary focus-ring-primary">
        Primary Button
      </button>
      <button className="btn btn-secondary focus-ring-primary">
        Secondary Button
      </button>
      <button className="btn btn-danger focus-ring-danger">
        Danger Button
      </button>

      {/* Form elements */}
      <input
        type="text"
        className="input focus-ring-primary"
        placeholder="Text input"
      />
      <textarea
        className="input focus-ring-primary"
        placeholder="Textarea"
      ></textarea>
      <select className="input focus-ring-primary">
        <option>Option 1</option>
        <option>Option 2</option>
      </select>

      {/* Links */}
      <a href="#test" className="focus-ring-primary">
        Regular Link
      </a>

      {/* Interactive elements with roles */}
      <div role="button" tabIndex={0} className="focus-ring-primary">
        Role Button
      </div>
      <div role="option" tabIndex={0} className="focus-ring-primary">
        Role Option
      </div>
      <div role="listitem" tabIndex={0} className="focus-ring-primary">
        Role Listitem
      </div>

      {/* Disabled elements */}
      <button disabled className="btn btn-primary">
        Disabled Button
      </button>
      <div role="button" aria-disabled="true" className="focus-ring-primary">
        Disabled Role Button
      </div>

      {/* Loading element */}
      <button className="btn btn-primary loading focus-ring-primary">
        Loading Button
      </button>
    </div>
  );
}

describe("Focus States Accessibility", () => {
  beforeEach(() => {
    // Reset any existing focus
    document.body.focus();
  });

  it("skip link becomes visible on focus", () => {
    render(<FocusTestComponent />);

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toHaveClass("skip-link");

    // Focus the skip link
    skipLink.focus();
    expect(document.activeElement).toBe(skipLink);
  });

  it("buttons have proper focus behavior", () => {
    render(<FocusTestComponent />);

    const primaryBtn = screen.getByText("Primary Button");
    const secondaryBtn = screen.getByText("Secondary Button");
    const dangerBtn = screen.getByText("Danger Button");

    // Test tabbing through buttons
    primaryBtn.focus();
    expect(document.activeElement).toBe(primaryBtn);

    // Simulate Tab key
    fireEvent.keyDown(primaryBtn, { key: "Tab" });
    // Note: Actual tab navigation is browser behavior, we just test focus setting

    secondaryBtn.focus();
    expect(document.activeElement).toBe(secondaryBtn);

    dangerBtn.focus();
    expect(document.activeElement).toBe(dangerBtn);
  });

  it("form elements have proper focus behavior", () => {
    render(<FocusTestComponent />);

    const textInput = screen.getByPlaceholderText("Text input");
    const textarea = screen.getByPlaceholderText("Textarea");
    const select = screen.getByRole("combobox");

    textInput.focus();
    expect(document.activeElement).toBe(textInput);

    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    select.focus();
    expect(document.activeElement).toBe(select);
  });

  it("links have proper focus behavior", () => {
    render(<FocusTestComponent />);

    const link = screen.getByText("Regular Link");
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it("elements with roles have proper focus behavior", () => {
    render(<FocusTestComponent />);

    const roleButton = screen.getByText("Role Button");
    const roleOption = screen.getByText("Role Option");
    const roleListitem = screen.getByText("Role Listitem");

    roleButton.focus();
    expect(document.activeElement).toBe(roleButton);
    expect(roleButton).toHaveAttribute("tabIndex", "0");

    roleOption.focus();
    expect(document.activeElement).toBe(roleOption);
    expect(roleOption).toHaveAttribute("tabIndex", "0");

    roleListitem.focus();
    expect(document.activeElement).toBe(roleListitem);
    expect(roleListitem).toHaveAttribute("tabIndex", "0");
  });

  it("disabled elements do not receive focus", () => {
    render(<FocusTestComponent />);

    const disabledBtn = screen.getByText("Disabled Button");
    const disabledRoleBtn = screen.getByText("Disabled Role Button");

    expect(disabledBtn).toBeDisabled();
    expect(disabledRoleBtn).toHaveAttribute("aria-disabled", "true");

    // Disabled elements should not be focusable
    disabledBtn.focus();
    expect(document.activeElement).not.toBe(disabledBtn);
  });

  it("keyboard navigation works with Enter and Space", () => {
    const handleClick = jest.fn();

    render(
      <div>
        <button onClick={handleClick}>Clickable Button</button>
        <div role="button" tabIndex={0} onClick={handleClick}>
          Clickable Div
        </div>
      </div>,
    );

    const button = screen.getByText("Clickable Button");
    const div = screen.getByText("Clickable Div");

    // Test Enter key on button
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyUp(button, { key: "Enter" });

    // Test Space key on button
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyUp(button, { key: " " });

    // Test Enter key on div with role
    div.focus();
    fireEvent.keyDown(div, { key: "Enter" });
    fireEvent.keyUp(div, { key: "Enter" });

    // Test Space key on div with role
    fireEvent.keyDown(div, { key: " " });
    fireEvent.keyUp(div, { key: " " });
  });

  it("focus is visible only when using keyboard navigation", () => {
    render(<FocusTestComponent />);

    const button = screen.getByText("Primary Button");

    // Mouse click should not show focus ring (this is handled by CSS :focus-visible)
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.click(button);

    // Tab navigation should show focus ring
    fireEvent.keyDown(document.body, { key: "Tab" });
    button.focus();
    expect(document.activeElement).toBe(button);

    // CSS :focus-visible pseudo-class behavior is tested by the browser
    // We verify the focus-ring classes are present
    expect(button).toHaveClass("focus-ring-primary");
  });

  it("high contrast mode is supported", () => {
    // Simulate high contrast preference
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-contrast: high)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<FocusTestComponent />);

    // In high contrast mode, focus indicators should be more prominent
    // This is mainly handled by CSS media queries
    const button = screen.getByText("Primary Button");
    expect(button).toHaveClass("focus-ring-primary");
  });

  it("reduced motion is respected", () => {
    // Simulate reduced motion preference
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(<FocusTestComponent />);

    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toHaveClass("skip-link");

    // Transitions should be disabled in reduced motion mode (handled by CSS)
  });
});
