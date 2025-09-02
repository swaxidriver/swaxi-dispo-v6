import React from "react";
import { render, fireEvent } from "@testing-library/react";

import { ThemeProvider } from "../../contexts/ThemeContext.jsx";
import ThemeSelector from "../../components/ThemeSelector.jsx";

describe("Enhanced Theme Selector (3-way toggle)", () => {
  it("renders all three theme options and updates selection", () => {
    const { container, getByRole } = render(
      <ThemeProvider>
        <ThemeSelector />
      </ThemeProvider>,
    );

    // Should have three buttons: Light, Dark, System
    const lightBtn = getByRole("button", { name: /light/i });
    const darkBtn = getByRole("button", { name: /dark/i });
    const systemBtn = getByRole("button", { name: /system/i });

    expect(lightBtn).toBeInTheDocument();
    expect(darkBtn).toBeInTheDocument();
    expect(systemBtn).toBeInTheDocument();

    // Click dark mode
    fireEvent.click(darkBtn);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(darkBtn).toHaveAttribute("aria-pressed", "true");

    // Click system mode
    fireEvent.click(systemBtn);
    expect(systemBtn).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("theme")).toBe("system");

    // Click light mode
    fireEvent.click(lightBtn);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
