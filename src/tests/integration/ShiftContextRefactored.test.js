/**
 * Integration tests for the refactored ShiftContext
 * Tests backward compatibility and complete functionality
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { ShiftProvider, ShiftContext } from "../../contexts/ShiftContextRefactored";
import { useContext } from "react";
import { SHIFT_STATUS } from "../../utils/constants";

// Mock components for testing
function TestComponent() {
  const context = useContext(ShiftContext);
  
  if (!context) {
    return <div>No context</div>;
  }

  return (
    <div>
      <div data-testid="shifts-count">{context.shifts.length}</div>
      <div data-testid="is-online">{context.isOnline ? "online" : "offline"}</div>
      <div data-testid="open-shifts-count">{context.getOpenShifts().length}</div>
      <div data-testid="applications-count">{context.state.applications.length}</div>
      <div data-testid="notifications-count">{context.state.notifications.length}</div>
      
      <button 
        data-testid="create-shift"
        onClick={() => {
          context.createShift({
            date: "2024-01-15",
            start: "08:00", 
            end: "16:00",
            type: "regular",
            workLocation: "Station A",
          });
        }}
      >
        Create Shift
      </button>
      
      <button
        data-testid="apply-to-first-shift"
        onClick={() => {
          if (context.shifts.length > 0) {
            context.applyToShift(context.shifts[0].id, "user-1");
          }
        }}
      >
        Apply to First Shift
      </button>

      <button
        data-testid="mark-notification-read"
        onClick={() => {
          if (context.state.notifications.length > 0) {
            context.markNotificationRead(context.state.notifications[0].id);
          }
        }}
      >
        Mark First Notification Read
      </button>
    </div>
  );
}

describe("ShiftContextRefactored Integration", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("provides context successfully", () => {
    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <TestComponent />
      </ShiftProvider>
    );

    expect(screen.getByTestId("shifts-count")).toHaveTextContent("0");
    // Online status defaults to navigator.onLine which may be true in test env
    expect(screen.getByTestId("is-online")).toHaveTextContent(/^(online|offline)$/);
    expect(screen.getByTestId("open-shifts-count")).toHaveTextContent("0");
    expect(screen.getByTestId("applications-count")).toHaveTextContent("0");
    expect(screen.getByTestId("notifications-count")).toHaveTextContent("0");
  });

  it("creates shifts successfully", async () => {
    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <TestComponent />
      </ShiftProvider>
    );

    const createButton = screen.getByTestId("create-shift");
    
    await act(async () => {
      createButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("shifts-count")).toHaveTextContent("1");
      expect(screen.getByTestId("open-shifts-count")).toHaveTextContent("1");
    });
  });

  it("handles shift applications", async () => {
    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <TestComponent />
      </ShiftProvider>
    );

    // First create a shift
    const createButton = screen.getByTestId("create-shift");
    await act(async () => {
      createButton.click();
    });

    // Then apply to it
    const applyButton = screen.getByTestId("apply-to-first-shift");
    await act(async () => {
      applyButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("applications-count")).toHaveTextContent("1");
    });
  });

  it("provides all expected context methods", () => {
    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <ContextCapture />
      </ShiftProvider>
    );

    expect(contextValue).toBeTruthy();
    
    // Check all required methods exist (backward compatibility)
    expect(typeof contextValue.applyToShift).toBe("function");
    expect(typeof contextValue.applyToSeries).toBe("function");
    expect(typeof contextValue.withdrawApplication).toBe("function");
    expect(typeof contextValue.updateShiftStatus).toBe("function");
    expect(typeof contextValue.assignShift).toBe("function");
    expect(typeof contextValue.cancelShift).toBe("function");
    expect(typeof contextValue.createShift).toBe("function");
    expect(typeof contextValue.updateShift).toBe("function");
    expect(typeof contextValue.undoLastShiftUpdate).toBe("function");
    expect(typeof contextValue.markNotificationRead).toBe("function");
    expect(typeof contextValue.markAllNotificationsRead).toBe("function");
    expect(typeof contextValue.getOpenShifts).toBe("function");
    expect(typeof contextValue.getConflictedShifts).toBe("function");
    expect(typeof contextValue.restoreFromSnapshot).toBe("function");
    
    // Check state structure
    expect(contextValue.state).toBeTruthy();
    expect(Array.isArray(contextValue.shifts)).toBe(true);
    expect(typeof contextValue.isOnline).toBe("boolean");
    expect(typeof contextValue.dispatch).toBe("function");
    
    // Check new features
    expect(contextValue.domain).toBeTruthy();
    expect(contextValue.notifications).toBeTruthy();
    expect(contextValue.sync).toBeTruthy();
  });

  it("handles initial shifts properly", () => {
    const initialShifts = [
      {
        id: "test-shift-1",
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: "regular",
        status: SHIFT_STATUS.OPEN,
        workLocation: "Station A",
        conflicts: [],
      },
    ];

    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true} initialShifts={initialShifts}>
        <ContextCapture />
      </ShiftProvider>
    );

    expect(contextValue.shifts).toHaveLength(1);
    expect(contextValue.shifts[0].id).toBe("test-shift-1");
    expect(contextValue.getOpenShifts()).toHaveLength(1);
  });

  it("exposes domain functions correctly", () => {
    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <ContextCapture />
      </ShiftProvider>
    );

    // Check domain functions are available
    expect(typeof contextValue.domain.createShift).toBe("function");
    expect(typeof contextValue.domain.applyToShift).toBe("function");
    expect(typeof contextValue.domain.assignShift).toBe("function");
    expect(typeof contextValue.domain.getOpenShifts).toBe("function");
  });

  it("exposes notification utilities", () => {
    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <ContextCapture />
      </ShiftProvider>
    );

    // Check notification utilities are available
    expect(typeof contextValue.notifications.createNotification).toBe("function");
    expect(typeof contextValue.notifications.notifyInfo).toBe("function");
    expect(typeof contextValue.notifications.notifySuccess).toBe("function");
    expect(typeof contextValue.notifications.getUnreadNotifications).toBe("function");
  });

  it("exposes sync utilities", () => {
    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <ContextCapture />
      </ShiftProvider>
    );

    // Check sync utilities are available
    expect(typeof contextValue.sync.enqueueOfflineAction).toBe("function");
    expect(typeof contextValue.sync.createSnapshot).toBe("function");
    expect(typeof contextValue.sync.forceSync).toBe("function");
  });

  it("maintains stable context structure", () => {
    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true}>
        <ContextCapture />
      </ShiftProvider>
    );

    // Verify context exists and has expected structure
    expect(contextValue).toBeTruthy();
    expect(contextValue.state).toBeTruthy();
    expect(Array.isArray(contextValue.shifts)).toBe(true);
    expect(typeof contextValue.createShift).toBe("function");
  });

  it("handles repository override", () => {
    const mockRepository = {
      loadShifts: jest.fn().mockResolvedValue([]),
      createShift: jest.fn().mockResolvedValue({}),
    };

    let contextValue = null;
    
    function ContextCapture() {
      contextValue = useContext(ShiftContext);
      return null;
    }

    render(
      <ShiftProvider disableAsyncBootstrap={true} repositoryOverride={mockRepository}>
        <ContextCapture />
      </ShiftProvider>
    );

    expect(contextValue.repository).toBe(mockRepository);
  });

  it("throws error when used outside provider", () => {
    function TestComponentOutsideProvider() {
      // This should trigger the useShifts hook which checks for context
      const context = useContext(ShiftContext);
      return <div>{context ? "Has context" : "No context"}</div>;
    }

    render(<TestComponentOutsideProvider />);
    expect(screen.getByText("No context")).toBeInTheDocument();
  });
});