/**
 * Integration test for email notifications with ShiftContext
 */

import { renderHook, act } from "@testing-library/react";

import { useShifts } from "../../contexts/useShifts";
import { ShiftContextProvider } from "../../contexts/ShiftContext";
import { SHIFT_STATUS } from "../../utils/constants";
import {
  notificationService,
  MockEmailProvider,
  MemoryStorage,
} from "../../../backend/notifications.js";

// Mock the notification service for testing
const mockEmailProvider = new MockEmailProvider();
const mockStorage = new MemoryStorage();

// Replace the singleton with our test instance
notificationService.emailProvider = mockEmailProvider;
notificationService.storage = mockStorage;

const TestWrapper = ({ children }) => (
  <ShiftContextProvider disableAsyncBootstrap={true} enableAsyncInTests={false}>
    {children}
  </ShiftContextProvider>
);

describe("Email Notification Integration", () => {
  beforeEach(() => {
    mockEmailProvider.clear();
    mockStorage.clear();
  });

  test("should queue email notification when assigning shift", async () => {
    const { result } = renderHook(() => useShifts(), { wrapper: TestWrapper });

    // Wait for initialization
    await act(async () => {
      // Create a test shift
      result.current.createShift({
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        workLocation: "Büro",
      });
    });

    const shiftId = result.current.shifts[0]?.id;
    expect(shiftId).toBeDefined();

    // Assign the shift
    await act(async () => {
      result.current.assignShift(shiftId, "disp1@stadtwerke-augsburg.de");
    });

    // Check that notification was queued
    const notifications = mockStorage.getAllNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      type: "assigned",
      recipient: "disp1@stadtwerke-augsburg.de",
      shiftId: shiftId,
    });

    // Verify shift is assigned
    const assignedShift = result.current.shifts.find((s) => s.id === shiftId);
    expect(assignedShift.status).toBe(SHIFT_STATUS.ASSIGNED);
    expect(assignedShift.assignedTo).toBe("disp1@stadtwerke-augsburg.de");
  });

  test("should send immediate removal notification when unassigning shift", async () => {
    const { result } = renderHook(() => useShifts(), { wrapper: TestWrapper });

    // Create and assign a shift
    await act(async () => {
      result.current.createShift({
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        workLocation: "Büro",
      });
    });

    const shiftId = result.current.shifts[0]?.id;

    await act(async () => {
      result.current.assignShift(shiftId, "disp1@stadtwerke-augsburg.de");
    });

    // Clear previous notifications
    mockEmailProvider.clear();

    // Unassign the shift
    await act(async () => {
      result.current.unassignShift(shiftId);
    });

    // Check that immediate removal email was sent
    const sentEmails = mockEmailProvider.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]).toMatchObject({
      to: "disp1@stadtwerke-augsburg.de",
      subject: "Dienst-Zuweisung entfernt - 15.1.2025",
    });

    // Verify shift is unassigned
    const unassignedShift = result.current.shifts.find((s) => s.id === shiftId);
    expect(unassignedShift.status).toBe(SHIFT_STATUS.OPEN);
    expect(unassignedShift.assignedTo).toBe(null);
  });

  test("should handle reassignment (removal + assignment notifications)", async () => {
    const { result } = renderHook(() => useShifts(), { wrapper: TestWrapper });

    // Create and assign a shift
    await act(async () => {
      result.current.createShift({
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        workLocation: "Büro",
      });
    });

    const shiftId = result.current.shifts[0]?.id;

    await act(async () => {
      result.current.assignShift(shiftId, "disp1@stadtwerke-augsburg.de");
    });

    // Clear previous notifications
    mockEmailProvider.clear();
    mockStorage.clear();

    // Reassign to different user
    await act(async () => {
      result.current.assignShift(shiftId, "disp2@stadtwerke-augsburg.de");
    });

    // Should queue assignment for new user
    const notifications = mockStorage.getAllNotifications();
    const assignmentNotification = notifications.find(
      (n) => n.type === "assigned",
    );
    expect(assignmentNotification).toMatchObject({
      type: "assigned",
      recipient: "disp2@stadtwerke-augsburg.de",
    });

    // Should send immediate removal email to previous user
    const sentEmails = mockEmailProvider.getSentEmails();
    const removalEmail = sentEmails.find(
      (email) => email.to === "disp1@stadtwerke-augsburg.de",
    );
    expect(removalEmail).toMatchObject({
      to: "disp1@stadtwerke-augsburg.de",
      subject: "Dienst-Zuweisung entfernt - 15.1.2025",
    });

    // Verify final assignment
    const reassignedShift = result.current.shifts.find((s) => s.id === shiftId);
    expect(reassignedShift.status).toBe(SHIFT_STATUS.ASSIGNED);
    expect(reassignedShift.assignedTo).toBe("disp2@stadtwerke-augsburg.de");
  });

  test("should process daily digest correctly", async () => {
    // Queue some test notifications directly
    await mockStorage.addNotification({
      id: "test_1",
      type: "assigned",
      recipient: "disp1@stadtwerke-augsburg.de",
      shiftId: "shift_1",
      shift: {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        workLocation: "Büro",
      },
      processed: false,
    });

    await mockStorage.addNotification({
      id: "test_2",
      type: "assigned",
      recipient: "disp1@stadtwerke-augsburg.de",
      shiftId: "shift_2",
      shift: {
        date: "2025-01-16",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        workLocation: "Büro",
      },
      processed: false,
    });

    // Process daily digest
    await notificationService.processDailyDigest();

    // Check that digest email was sent
    const sentEmails = mockEmailProvider.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    const digestEmail = sentEmails[0];
    expect(digestEmail.to).toBe("disp1@stadtwerke-augsburg.de");
    expect(digestEmail.subject).toContain("Dienst-Übersicht");
    expect(digestEmail.html).toContain("2"); // Should mention 2 assignments

    // Check that notifications are marked as processed
    const notifications = mockStorage.getAllNotifications();
    expect(notifications.every((n) => n.processed)).toBe(true);
  });
});
