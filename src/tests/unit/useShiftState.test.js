/**
 * Tests for useShiftState hook
 */

import { renderHook, act } from "@testing-library/react";
import { useShiftState } from "../../hooks/useShiftState";
import { SHIFT_STATUS } from "../../utils/constants";

describe("useShiftState", () => {
  it("initializes with default state", () => {
    const { result } = renderHook(() => useShiftState());
    
    expect(result.current.state.shifts).toEqual([]);
    expect(result.current.state.applications).toEqual([]);
    expect(result.current.state.notifications).toEqual([]);
    expect(result.current.state.isOnline).toBe(false);
    expect(result.current.refs.seeded.current).toBe(false);
    expect(result.current.refs.bootstrapped.current).toBe(false);
  });

  it("accepts override initial state", () => {
    const overrideState = {
      shifts: [{ id: "test-shift", status: SHIFT_STATUS.OPEN }],
      applications: [{ id: "test-app", status: "pending" }],
      notifications: [],
      filters: { timeRange: "all", status: "all", location: "all" },
      dataSource: "localStorage",
      isOnline: true,
      lastSync: null,
      lastActivity: null,
      undoState: null,
    };

    const { result } = renderHook(() => useShiftState(overrideState));
    
    expect(result.current.state.shifts).toHaveLength(1);
    expect(result.current.state.applications).toHaveLength(1);
    expect(result.current.state.isOnline).toBe(true);
  });

  describe("shift actions", () => {
    it("initializes shifts", () => {
      const { result } = renderHook(() => useShiftState());
      const testShifts = [
        { id: "shift-1", status: SHIFT_STATUS.OPEN },
        { id: "shift-2", status: SHIFT_STATUS.ASSIGNED },
      ];

      act(() => {
        result.current.actions.initShifts(testShifts);
      });

      expect(result.current.state.shifts).toEqual(testShifts);
    });

    it("adds a shift", () => {
      const { result } = renderHook(() => useShiftState());
      const newShift = { id: "new-shift", status: SHIFT_STATUS.OPEN };

      act(() => {
        result.current.actions.addShift(newShift);
      });

      expect(result.current.state.shifts).toContain(newShift);
    });

    it("updates a shift", () => {
      const { result } = renderHook(() => useShiftState());
      const initialShift = { id: "shift-1", status: SHIFT_STATUS.OPEN, assignedTo: null };

      act(() => {
        result.current.actions.initShifts([initialShift]);
      });

      const updatedShift = { id: "shift-1", status: SHIFT_STATUS.ASSIGNED, assignedTo: "user-1" };

      act(() => {
        result.current.actions.updateShift(updatedShift);
      });

      expect(result.current.state.shifts[0].status).toBe(SHIFT_STATUS.ASSIGNED);
      expect(result.current.state.shifts[0].assignedTo).toBe("user-1");
    });

    it("assigns a shift", () => {
      const { result } = renderHook(() => useShiftState());
      const initialShift = { id: "shift-1", status: SHIFT_STATUS.OPEN, assignedTo: null };

      act(() => {
        result.current.actions.initShifts([initialShift]);
      });

      act(() => {
        result.current.actions.assignShift("shift-1", "user-1");
      });

      expect(result.current.state.shifts[0].status).toBe("assigned");
      expect(result.current.state.shifts[0].assignedTo).toBe("user-1");
    });
  });

  describe("application actions", () => {
    it("initializes applications", () => {
      const { result } = renderHook(() => useShiftState());
      const testApps = [
        { id: "app-1", status: "pending" },
        { id: "app-2", status: "approved" },
      ];

      act(() => {
        result.current.actions.initApplications(testApps);
      });

      expect(result.current.state.applications).toEqual(testApps);
    });

    it("adds an application", () => {
      const { result } = renderHook(() => useShiftState());
      const newApp = { id: "new-app", status: "pending" };

      act(() => {
        result.current.actions.addApplication(newApp);
      });

      expect(result.current.state.applications).toContain(newApp);
    });

    it("adds series applications", () => {
      const { result } = renderHook(() => useShiftState());
      const seriesApps = [
        { id: "app-1", status: "pending" },
        { id: "app-2", status: "pending" },
      ];

      act(() => {
        result.current.actions.addSeriesApplication(seriesApps);
      });

      expect(result.current.state.applications).toEqual(seriesApps);
    });

    it("updates an application", () => {
      const { result } = renderHook(() => useShiftState());
      const initialApp = { id: "app-1", status: "pending" };

      act(() => {
        result.current.actions.initApplications([initialApp]);
      });

      const updatedApp = { id: "app-1", status: "approved" };

      act(() => {
        result.current.actions.updateApplication(updatedApp);
      });

      expect(result.current.state.applications[0].status).toBe("approved");
    });
  });

  describe("notification actions", () => {
    it("initializes notifications", () => {
      const { result } = renderHook(() => useShiftState());
      const testNotifications = [
        { id: "notif-1", type: "info", isRead: false },
        { id: "notif-2", type: "warning", isRead: true },
      ];

      act(() => {
        result.current.actions.initNotifications(testNotifications);
      });

      expect(result.current.state.notifications).toEqual(testNotifications);
    });

    it("adds a notification", () => {
      const { result } = renderHook(() => useShiftState());
      const newNotification = { id: "new-notif", type: "success", isRead: false };

      act(() => {
        result.current.actions.addNotification(newNotification);
      });

      expect(result.current.state.notifications).toContain(newNotification);
    });

    it("marks notification as read", () => {
      const { result } = renderHook(() => useShiftState());
      const notification = { id: "notif-1", type: "info", isRead: false };

      act(() => {
        result.current.actions.initNotifications([notification]);
      });

      act(() => {
        result.current.actions.markNotificationRead("notif-1");
      });

      expect(result.current.state.notifications[0].isRead).toBe(true);
    });

    it("marks all notifications as read", () => {
      const { result } = renderHook(() => useShiftState());
      const notifications = [
        { id: "notif-1", type: "info", isRead: false },
        { id: "notif-2", type: "warning", isRead: false },
      ];

      act(() => {
        result.current.actions.initNotifications(notifications);
      });

      act(() => {
        result.current.actions.markAllNotificationsRead();
      });

      expect(result.current.state.notifications.every(n => n.isRead)).toBe(true);
    });

    it("deletes a notification", () => {
      const { result } = renderHook(() => useShiftState());
      const notifications = [
        { id: "notif-1", type: "info", isRead: false },
        { id: "notif-2", type: "warning", isRead: false },
      ];

      act(() => {
        result.current.actions.initNotifications(notifications);
      });

      act(() => {
        result.current.actions.deleteNotification("notif-1");
      });

      expect(result.current.state.notifications).toHaveLength(1);
      expect(result.current.state.notifications[0].id).toBe("notif-2");
    });
  });

  describe("filter and status actions", () => {
    it("updates filters", () => {
      const { result } = renderHook(() => useShiftState());
      const filterUpdates = { status: "open", location: "Station A" };

      act(() => {
        result.current.actions.updateFilters(filterUpdates);
      });

      expect(result.current.state.filters.status).toBe("open");
      expect(result.current.state.filters.location).toBe("Station A");
      expect(result.current.state.filters.timeRange).toBe("all"); // unchanged
    });

    it("sets online status", () => {
      const { result } = renderHook(() => useShiftState());

      act(() => {
        result.current.actions.setOnline(true);
      });

      expect(result.current.state.isOnline).toBe(true);
    });

    it("sets last activity", () => {
      const { result } = renderHook(() => useShiftState());
      const timestamp = Date.now();

      act(() => {
        result.current.actions.setLastActivity(timestamp);
      });

      expect(result.current.state.lastActivity).toBe(timestamp);
    });
  });

  describe("undo actions", () => {
    it("sets undo state", () => {
      const { result } = renderHook(() => useShiftState());
      const undoState = { type: "shift_update", data: { id: "shift-1" } };

      act(() => {
        result.current.actions.setUndoState(undoState);
      });

      expect(result.current.state.undoState).toEqual(undoState);
    });

    it("clears undo state", () => {
      const { result } = renderHook(() => useShiftState());
      const undoState = { type: "shift_update", data: { id: "shift-1" } };

      act(() => {
        result.current.actions.setUndoState(undoState);
      });

      act(() => {
        result.current.actions.clearUndoState();
      });

      expect(result.current.state.undoState).toBeNull();
    });
  });
});