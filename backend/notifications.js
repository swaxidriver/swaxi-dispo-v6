/**
 * Email Notification Service for Stadtwerke Augsburg Disposition System
 *
 * Handles email notifications for shift assignments with German templates,
 * daily digest functionality, and opt-out support.
 */

import { ROLES } from "./rbac.js";

/**
 * Email notification service for Disponenten assignments
 */
export class NotificationService {
  constructor(options = {}) {
    this.emailProvider = options.emailProvider || new MockEmailProvider();
    this.storage = options.storage || new MemoryStorage();
    this.digestSchedule = options.digestSchedule || "18:30";
    this.isEnabled = options.isEnabled !== false;
  }

  /**
   * Queue assignment notification
   * @param {Object} assignment - Assignment details
   * @param {string} assignment.shiftId - Shift ID
   * @param {string} assignment.assignedTo - User email who was assigned
   * @param {Object} assignment.shift - Shift details
   * @param {string} assignment.type - 'assigned' or 'removed'
   */
  async queueAssignmentNotification(assignment) {
    if (!this.isEnabled) return;

    const notification = {
      id: `${assignment.shiftId}_${assignment.assignedTo}_${Date.now()}`,
      type: assignment.type || "assigned",
      recipient: assignment.assignedTo,
      shiftId: assignment.shiftId,
      shift: assignment.shift,
      timestamp: new Date(),
      processed: false,
    };

    // Check if user has opted out
    const userPrefs = await this.getUserPreferences(assignment.assignedTo);
    if (userPrefs.emailNotifications === false) {
      return;
    }

    // Store for digest
    await this.storage.addNotification(notification);

    // Send immediate notification for removals
    if (assignment.type === "removed") {
      await this.sendImmediateNotification(notification);
      notification.processed = true;
      await this.storage.updateNotification(notification);
    }
  }

  /**
   * Send immediate email notification (for removals)
   */
  async sendImmediateNotification(notification) {
    const template = this.getRemovalTemplate(notification);

    await this.emailProvider.sendEmail({
      to: notification.recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Process daily digest at 18:30
   */
  async processDailyDigest() {
    if (!this.isEnabled) return;

    const pendingNotifications = await this.storage.getPendingNotifications();
    const groupedByUser = this.groupNotificationsByUser(pendingNotifications);

    for (const [userEmail, notifications] of Object.entries(groupedByUser)) {
      // Check opt-out preference
      const userPrefs = await this.getUserPreferences(userEmail);
      if (userPrefs.emailNotifications === false) {
        // Mark as processed even if not sent due to opt-out
        await this.markNotificationsProcessed(notifications);
        continue;
      }

      const template = this.getDigestTemplate(userEmail, notifications);

      await this.emailProvider.sendEmail({
        to: userEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Mark notifications as processed
      await this.markNotificationsProcessed(notifications);
    }
  }

  /**
   * Get user email notification preferences
   */
  async getUserPreferences(userEmail) {
    return (
      (await this.storage.getUserPreferences(userEmail)) || {
        emailNotifications: true, // Default to enabled
      }
    );
  }

  /**
   * Update user email notification preferences
   */
  async updateUserPreferences(userEmail, preferences) {
    return await this.storage.updateUserPreferences(userEmail, preferences);
  }

  /**
   * Group notifications by user
   */
  groupNotificationsByUser(notifications) {
    return notifications.reduce((acc, notification) => {
      if (!acc[notification.recipient]) {
        acc[notification.recipient] = [];
      }
      acc[notification.recipient].push(notification);
      return acc;
    }, {});
  }

  /**
   * Mark notifications as processed
   */
  async markNotificationsProcessed(notifications) {
    for (const notification of notifications) {
      notification.processed = true;
      await this.storage.updateNotification(notification);
    }
  }

  /**
   * German email template for assignment removal
   */
  getRemovalTemplate(notification) {
    const shift = notification.shift;
    const date = new Date(shift.date).toLocaleDateString("de-DE");
    const timeRange = `${shift.start} - ${shift.end}`;

    return {
      subject: `Dienst-Zuweisung entfernt - ${date}`,
      html: `
        <h2>Dienst-Zuweisung entfernt</h2>
        <p>Hallo,</p>
        <p>Ihre Zuweisung für den folgenden Dienst wurde <strong>entfernt</strong>:</p>
        <ul>
          <li><strong>Datum:</strong> ${date}</li>
          <li><strong>Zeit:</strong> ${timeRange}</li>
          <li><strong>Typ:</strong> ${shift.type}</li>
          <li><strong>Standort:</strong> ${shift.workLocation || "Büro"}</li>
        </ul>
        <p>Bitte beachten Sie diese Änderung in Ihrer Planung.</p>
        <p>Mit freundlichen Grüßen,<br>Ihr Disposition-Team</p>
        <hr>
        <small>Um diese E-Mails zu deaktivieren, wenden Sie sich an Ihren Administrator.</small>
      `,
      text: `
Dienst-Zuweisung entfernt

Hallo,

Ihre Zuweisung für den folgenden Dienst wurde entfernt:

Datum: ${date}
Zeit: ${timeRange}
Typ: ${shift.type}
Standort: ${shift.workLocation || "Büro"}

Bitte beachten Sie diese Änderung in Ihrer Planung.

Mit freundlichen Grüßen,
Ihr Disposition-Team

Um diese E-Mails zu deaktivieren, wenden Sie sich an Ihren Administrator.
      `.trim(),
    };
  }

  /**
   * German email template for daily digest
   */
  getDigestTemplate(userEmail, notifications) {
    const today = new Date().toLocaleDateString("de-DE");
    const assignmentCount = notifications.filter(
      (n) => n.type === "assigned",
    ).length;

    let content = `
      <h2>Tägliche Dienst-Übersicht - ${today}</h2>
      <p>Hallo,</p>
      <p>Hier ist Ihre tägliche Übersicht über Dienst-Zuweisungen:</p>
    `;

    if (assignmentCount === 0) {
      content += "<p>Keine neuen Zuweisungen heute.</p>";
    } else {
      content += `<p>Sie haben <strong>${assignmentCount}</strong> neue Dienst-Zuweisung${assignmentCount > 1 ? "en" : ""}:</p><ul>`;

      notifications
        .filter((n) => n.type === "assigned")
        .forEach((notification) => {
          const shift = notification.shift;
          const date = new Date(shift.date).toLocaleDateString("de-DE");
          const timeRange = `${shift.start} - ${shift.end}`;

          content += `
            <li>
              <strong>${date}</strong> - ${timeRange}<br>
              Typ: ${shift.type}, Standort: ${shift.workLocation || "Büro"}
            </li>
          `;
        });

      content += "</ul>";
    }

    content += `
      <p>Mit freundlichen Grüßen,<br>Ihr Disposition-Team</p>
      <hr>
      <small>
        Diese E-Mail wird täglich um 18:30 Uhr versendet.<br>
        Um diese E-Mails zu deaktivieren, wenden Sie sich an Ihren Administrator.
      </small>
    `;

    const textContent = content
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      subject: `Dienst-Übersicht - ${today}`,
      html: content,
      text: textContent,
    };
  }

  /**
   * Start daily digest scheduler (in production, use proper cron job)
   */
  startDigestScheduler() {
    if (!this.isEnabled) return;

    const [hours, minutes] = this.digestSchedule.split(":").map(Number);

    // Simple interval-based scheduler for demo
    // In production, use proper cron job or task scheduler
    const checkInterval = 60000; // Check every minute

    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        try {
          await this.processDailyDigest();
        } catch (error) {
          console.error("Failed to process daily digest:", error);
        }
      }
    }, checkInterval);
  }
}

/**
 * Mock email provider for development/testing
 */
export class MockEmailProvider {
  constructor() {
    this.sentEmails = [];
  }

  async sendEmail(email) {
    console.log(`[MockEmail] Sending to ${email.to}: ${email.subject}`);
    this.sentEmails.push({
      ...email,
      sentAt: new Date(),
    });
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clear() {
    this.sentEmails = [];
  }
}

/**
 * In-memory storage for development/testing
 */
export class MemoryStorage {
  constructor() {
    this.notifications = [];
    this.userPreferences = new Map();
  }

  async addNotification(notification) {
    this.notifications.push(notification);
  }

  async updateNotification(notification) {
    const index = this.notifications.findIndex((n) => n.id === notification.id);
    if (index >= 0) {
      this.notifications[index] = notification;
    }
  }

  async getPendingNotifications() {
    return this.notifications.filter((n) => !n.processed);
  }

  async getUserPreferences(userEmail) {
    return this.userPreferences.get(userEmail);
  }

  async updateUserPreferences(userEmail, preferences) {
    this.userPreferences.set(userEmail, preferences);
  }

  // Test helpers
  clear() {
    this.notifications = [];
    this.userPreferences.clear();
  }

  getAllNotifications() {
    return this.notifications;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types for testing
export const NOTIFICATION_TYPES = {
  ASSIGNED: "assigned",
  REMOVED: "removed",
};
