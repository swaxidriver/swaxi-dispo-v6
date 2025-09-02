import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import Navigation from "../components/Navigation.jsx";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import { ThemeProvider } from "../contexts/ThemeContext.jsx";
import { I18nProvider } from "../contexts/I18nContext.jsx";

// Mock the feedback context since it might not be available in tests
jest.mock("../contexts/useFeedback", () => ({
  useFeedback: () => ({
    open: jest.fn(),
  }),
}));

const TestProviders = ({ children }) => (
  <MemoryRouter>
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  </MemoryRouter>
);

describe("Mobile Navigation", () => {
  // Mock window size for mobile testing
  const originalInnerWidth = global.innerWidth;

  beforeEach(() => {
    // Set mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event("resize"));
  });

  afterEach(() => {
    // Restore original viewport
    global.innerWidth = originalInnerWidth;
    global.dispatchEvent(new Event("resize"));

    // Clean up any open modals
    document.body.style.overflow = "";
  });

  it("shows hamburger button on mobile screens", () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    expect(hamburgerButton).toBeInTheDocument();
    expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    expect(hamburgerButton).toHaveAttribute("aria-label", "Hauptmenü öffnen");
  });

  it("opens mobile menu when hamburger button is clicked", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");

    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });
  });

  it("closes mobile menu when close button is clicked", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Close menu
    const closeButton = screen.getByTestId("mobile-nav-close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("closes mobile menu when ESC key is pressed", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Press ESC key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("closes mobile menu when overlay is clicked", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Click overlay
    const overlay = document.querySelector(".mobile-menu-overlay");
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("contains all navigation links in mobile menu", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Check for main navigation links
    expect(screen.getByTestId("mobile-nav-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-settings")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-nav-test")).toBeInTheDocument();
  });

  it("has touch-friendly button sizes (minimum 44x44px)", () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    const styles = window.getComputedStyle(hamburgerButton);

    // The button should have minimum dimensions for touch targets
    expect(hamburgerButton).toHaveStyle("min-width: 44px");
    expect(hamburgerButton).toHaveStyle("min-height: 44px");
  });

  it("prevents body scroll when menu is open", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Initially body should not have overflow hidden
    expect(document.body.style.overflow).toBe("");

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("hidden");
    });

    // Close menu
    const closeButton = screen.getByTestId("mobile-nav-close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("navigates when mobile menu link is clicked", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    // Open menu
    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Click a navigation link
    const calendarLink = screen.getByTestId("mobile-nav-calendar");
    fireEvent.click(calendarLink);

    // Menu should close after navigation
    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });
  });

  it("has proper ARIA attributes for accessibility", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");

    // Initial ARIA state
    expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    expect(hamburgerButton).toHaveAttribute("aria-controls", "mobile-menu");
    expect(hamburgerButton).toHaveAttribute("aria-label", "Hauptmenü öffnen");

    // Open menu
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");
      const mobileMenu = screen.getByTestId("mobile-menu");
      expect(mobileMenu).toHaveAttribute(
        "aria-label",
        "Mobile Hauptnavigation",
      );
    });
  });

  it("returns focus to hamburger button when menu is closed", async () => {
    render(
      <TestProviders>
        <Navigation />
      </TestProviders>,
    );

    const hamburgerButton = screen.getByTestId("mobile-nav-toggle");

    // Open menu
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    // Close menu via close button
    const closeButton = screen.getByTestId("mobile-nav-close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
      // Focus should return to hamburger button
      expect(hamburgerButton).toHaveFocus();
    });
  });
});
