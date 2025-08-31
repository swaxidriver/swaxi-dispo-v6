/**
 * Tests for Email Notification Service
 */

import {
  NotificationService,
  MockEmailProvider,
  MemoryStorage,
  NOTIFICATION_TYPES,
} from "./notifications.js";

describe("NotificationService", () => {
  let notificationService;
  let mockEmailProvider;
  let mockStorage;

  beforeEach(() => {
    mockEmailProvider = new MockEmailProvider();
    mockStorage = new MemoryStorage();
    notificationService = new NotificationService({
      emailProvider: mockEmailProvider,
      storage: mockStorage,
      digestSchedule: "18:30",
    });
  });

  afterEach(() => {
    mockEmailProvider.clear();
    mockStorage.clear();
  });

  describe("Assignment Notifications", () => {
    test("should queue assignment notification", async () => {
      const assignment = {
        shiftId: "shift_123",
        assignedTo: "disp1@stadtwerke-augsburg.de",
        type: NOTIFICATION_TYPES.ASSIGNED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
          workLocation: "Büro",
        },
      };

      await notificationService.queueAssignmentNotification(assignment);

      const notifications = mockStorage.getAllNotifications();
      expect(notifications).toHaveLength(1);
      expect(notifications[0]).toMatchObject({
        type: NOTIFICATION_TYPES.ASSIGNED,
        recipient: "disp1@stadtwerke-augsburg.de",
        shiftId: "shift_123",
        processed: false,
      });
    });

    test("should send immediate notification for removals", async () => {
      const assignment = {
        shiftId: "shift_123",
        assignedTo: "disp1@stadtwerke-augsburg.de",
        type: NOTIFICATION_TYPES.REMOVED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
          workLocation: "Büro",
        },
      };

      await notificationService.queueAssignmentNotification(assignment);

      // Should send immediate email
      const sentEmails = mockEmailProvider.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toMatchObject({
        to: "disp1@stadtwerke-augsburg.de",
        subject: "Dienst-Zuweisung entfernt - 15.1.2025",
      });

      // Should mark as processed
      const notifications = mockStorage.getAllNotifications();
      expect(notifications[0].processed).toBe(true);
    });

    test("should not send notification if user opted out", async () => {
      // Set user preference to opt out
      await mockStorage.updateUserPreferences("disp1@stadtwerke-augsburg.de", {
        emailNotifications: false,
      });

      const assignment = {
        shiftId: "shift_123",
        assignedTo: "disp1@stadtwerke-augsburg.de",
        type: NOTIFICATION_TYPES.ASSIGNED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
        },
      };

      await notificationService.queueAssignmentNotification(assignment);

      // Should not queue notification
      const notifications = mockStorage.getAllNotifications();
      expect(notifications).toHaveLength(0);
    });
  });

  describe("Daily Digest", () => {
    test("should process daily digest with assignment notifications", async () => {
      // Queue some assignment notifications
      const assignments = [
        {
          shiftId: "shift_1",
          assignedTo: "disp1@stadtwerke-augsburg.de",
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-15",
            start: "08:00",
            end: "16:00",
            type: "Frühdienst",
            workLocation: "Büro",
          },
        },
        {
          shiftId: "shift_2",
          assignedTo: "disp1@stadtwerke-augsburg.de",
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-16",
            start: "08:00",
            end: "16:00",
            type: "Frühdienst",
            workLocation: "Büro",
          },
        },
      ];

      for (const assignment of assignments) {
        await notificationService.queueAssignmentNotification(assignment);
      }

      // Process digest
      await notificationService.processDailyDigest();

      // Should send digest email
      const sentEmails = mockEmailProvider.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      const digestEmail = sentEmails[0];
      expect(digestEmail.to).toBe("disp1@stadtwerke-augsburg.de");
      expect(digestEmail.subject).toContain("Dienst-Übersicht");
      expect(digestEmail.html).toContain("2"); // Should mention 2 assignments
      expect(digestEmail.html).toContain("Frühdienst");

      // Should mark notifications as processed
      const notifications = mockStorage.getAllNotifications();
      expect(notifications.every((n) => n.processed)).toBe(true);
    });

    test("should group notifications by user in digest", async () => {
      // Queue notifications for different users
      const assignments = [
        {
          shiftId: "shift_1",
          assignedTo: "disp1@stadtwerke-augsburg.de",
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-15",
            start: "08:00",
            end: "16:00",
            type: "Frühdienst",
          },
        },
        {
          shiftId: "shift_2",
          assignedTo: "disp2@stadtwerke-augsburg.de",
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-15",
            start: "16:00",
            end: "22:00",
            type: "Spätdienst",
          },
        },
      ];

      for (const assignment of assignments) {
        await notificationService.queueAssignmentNotification(assignment);
      }

      await notificationService.processDailyDigest();

      // Should send separate emails to each user
      const sentEmails = mockEmailProvider.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      const recipients = sentEmails.map((email) => email.to);
      expect(recipients).toContain("disp1@stadtwerke-augsburg.de");
      expect(recipients).toContain("disp2@stadtwerke-augsburg.de");
    });

    test("should not send digest if user opted out", async () => {
      // First queue notification, then set opt-out preference
      const assignment = {
        shiftId: "shift_1",
        assignedTo: "disp1@stadtwerke-augsburg.de",
        type: NOTIFICATION_TYPES.ASSIGNED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
        },
      };

      await notificationService.queueAssignmentNotification(assignment);

      // Now set user preference to opt out
      await mockStorage.updateUserPreferences("disp1@stadtwerke-augsburg.de", {
        emailNotifications: false,
      });

      await notificationService.processDailyDigest();

      // Should not send email but mark as processed
      const sentEmails = mockEmailProvider.getSentEmails();
      expect(sentEmails).toHaveLength(0);

      const notifications = mockStorage.getAllNotifications();
      expect(notifications[0].processed).toBe(true);
    });

    test("should handle empty digest gracefully", async () => {
      await notificationService.processDailyDigest();

      // Should not send any emails
      const sentEmails = mockEmailProvider.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("German Email Templates", () => {
    test("should generate German removal email template", () => {
      const notification = {
        type: NOTIFICATION_TYPES.REMOVED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
          workLocation: "Büro",
        },
      };

      const template = notificationService.getRemovalTemplate(notification);

      expect(template.subject).toBe("Dienst-Zuweisung entfernt - 15.1.2025");
      expect(template.html).toContain("Dienst-Zuweisung entfernt");
      expect(template.html).toContain("15.1.2025");
      expect(template.html).toContain("08:00 - 16:00");
      expect(template.html).toContain("Frühdienst");
      expect(template.html).toContain("Büro");
      expect(template.text).toContain("Dienst-Zuweisung entfernt");
    });

    test("should generate German digest email template", () => {
      const notifications = [
        {
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-15",
            start: "08:00",
            end: "16:00",
            type: "Frühdienst",
            workLocation: "Büro",
          },
        },
        {
          type: NOTIFICATION_TYPES.ASSIGNED,
          shift: {
            date: "2025-01-16",
            start: "16:00",
            end: "22:00",
            type: "Spätdienst",
            workLocation: "Außendienst",
          },
        },
      ];

      const template = notificationService.getDigestTemplate(
        "user@test.de",
        notifications,
      );

      expect(template.subject).toContain("Dienst-Übersicht");
      expect(template.html).toContain("Tägliche Dienst-Übersicht");
      expect(template.html).toContain("2"); // Should mention 2 assignments
      expect(template.html).toContain("Frühdienst");
      expect(template.html).toContain("Spätdienst");
      expect(template.html).toContain("18:30"); // Mention digest time
      expect(template.text).toContain("Tägliche Dienst-Übersicht");
    });

    test("should generate empty digest template when no assignments", () => {
      const template = notificationService.getDigestTemplate(
        "user@test.de",
        [],
      );

      expect(template.html).toContain("Keine neuen Zuweisungen heute");
      expect(template.text).toContain("Keine neuen Zuweisungen heute");
    });
  });

  describe("User Preferences", () => {
    test("should get default user preferences", async () => {
      const prefs = await notificationService.getUserPreferences("new@user.de");

      expect(prefs.emailNotifications).toBe(true);
    });

    test("should update user preferences", async () => {
      await notificationService.updateUserPreferences("user@test.de", {
        emailNotifications: false,
      });

      const prefs =
        await notificationService.getUserPreferences("user@test.de");
      expect(prefs.emailNotifications).toBe(false);
    });
  });

  describe("Service Configuration", () => {
    test("should disable service when isEnabled is false", async () => {
      const disabledService = new NotificationService({
        emailProvider: mockEmailProvider,
        storage: mockStorage,
        isEnabled: false,
      });

      const assignment = {
        shiftId: "shift_123",
        assignedTo: "disp1@stadtwerke-augsburg.de",
        type: NOTIFICATION_TYPES.ASSIGNED,
        shift: {
          date: "2025-01-15",
          start: "08:00",
          end: "16:00",
          type: "Frühdienst",
        },
      };

      await disabledService.queueAssignmentNotification(assignment);
      await disabledService.processDailyDigest();

      // Should not queue notifications or send emails
      const notifications = mockStorage.getAllNotifications();
      const sentEmails = mockEmailProvider.getSentEmails();

      expect(notifications).toHaveLength(0);
      expect(sentEmails).toHaveLength(0);
    });
  });
});

describe("MockEmailProvider", () => {
  test("should track sent emails", async () => {
    const provider = new MockEmailProvider();

    await provider.sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
      text: "Test",
    });

    const sentEmails = provider.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0]).toMatchObject({
      to: "test@example.com",
      subject: "Test Subject",
    });
    expect(sentEmails[0].sentAt).toBeInstanceOf(Date);
  });

  test("should clear sent emails", async () => {
    const provider = new MockEmailProvider();

    await provider.sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "Test",
      text: "Test",
    });

    provider.clear();

    expect(provider.getSentEmails()).toHaveLength(0);
  });
});

describe("MemoryStorage", () => {
  test("should store and retrieve notifications", async () => {
    const storage = new MemoryStorage();

    const notification = {
      id: "test_123",
      type: NOTIFICATION_TYPES.ASSIGNED,
      recipient: "test@example.com",
      processed: false,
    };

    await storage.addNotification(notification);

    const pending = await storage.getPendingNotifications();
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject(notification);
  });

  test("should update notifications", async () => {
    const storage = new MemoryStorage();

    const notification = {
      id: "test_123",
      processed: false,
    };

    await storage.addNotification(notification);

    notification.processed = true;
    await storage.updateNotification(notification);

    const pending = await storage.getPendingNotifications();
    expect(pending).toHaveLength(0);

    const all = storage.getAllNotifications();
    expect(all[0].processed).toBe(true);
  });

  test("should handle user preferences", async () => {
    const storage = new MemoryStorage();

    await storage.updateUserPreferences("user@test.de", {
      emailNotifications: false,
    });

    const prefs = await storage.getUserPreferences("user@test.de");
    expect(prefs.emailNotifications).toBe(false);
  });
});
