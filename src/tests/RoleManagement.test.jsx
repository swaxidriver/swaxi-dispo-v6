import { render, screen, fireEvent } from "@testing-library/react";

import RoleManagement from "../components/RoleManagement";
import { ROLES } from "../utils/constants";

const users = [
  { id: "1", name: "Alice", role: ROLES.ADMIN },
  { id: "2", name: "Bob", role: ROLES.DISPONENT },
];

const onUpdateRole = jest.fn();

describe("RoleManagement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders users and allows editing manageable role", () => {
    render(<RoleManagement users={users} onUpdateRole={onUpdateRole} />);
    // Bob can manage shifts (disponent? actually canManageShifts returns false for disponent) so only Alice shows button
    const buttons = screen.getAllByText(/Bearbeiten/);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    const select = screen.getByDisplayValue(users[0].role);
    fireEvent.change(select, { target: { value: ROLES.CHIEF } });
    expect(onUpdateRole).toHaveBeenCalledWith("1", ROLES.CHIEF);
  });
});
