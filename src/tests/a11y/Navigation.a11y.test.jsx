import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import Navigation from "../../components/Navigation.jsx";
import { AuthProvider } from "../../contexts/AuthContext.jsx";
import { ThemeProvider } from "../../contexts/ThemeContext.jsx";

describe("Navigation accessibility", () => {
  it("has no axe violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <ThemeProvider>
            <Navigation />
          </ThemeProvider>
        </AuthProvider>
      </MemoryRouter>,
    );
    await expect(container).toHaveNoA11yViolations();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
