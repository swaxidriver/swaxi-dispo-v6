import { render, screen } from "@testing-library/react";

import VersionBadge from "../components/VersionBadge";

describe("VersionBadge", () => {
  it("renders version badge with defined version", () => {
    render(<VersionBadge />);
    const el = screen.getByTestId("app-version");
    expect(el).toBeInTheDocument();
    expect(el.textContent).toMatch(/^v/);
  });
});
