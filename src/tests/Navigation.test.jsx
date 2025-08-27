import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Navigation from "../components/Navigation";
import AuthContext from "../contexts/AuthContext";

function renderNav(user) {
  const logout = jest.fn();
  render(
    <AuthContext.Provider value={{ user, logout }}>
      <MemoryRouter initialEntries={["/"]}>
        <Navigation />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return { logout };
}

describe("Navigation", () => {
  test("shows login link (Anmelden) when not authenticated", () => {
    renderNav(null);
    expect(screen.getByRole("link", { name: /Anmelden/i })).toBeInTheDocument();
    expect(screen.queryByText(/Abmelden/)).not.toBeInTheDocument();
  });

  test("shows admin links and logout when admin", () => {
    const { logout } = renderNav({ name: "Admin", role: "admin" });
    expect(
      screen.getByRole("link", { name: "Verwaltung" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Audit" })).toBeInTheDocument();
    const btn = screen.getByRole("button", { name: /Abmelden \(admin\)/ });
    fireEvent.click(btn);
    expect(logout).toHaveBeenCalled();
  });
});
