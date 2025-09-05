/**
 * useShiftNotifications - Notification Management Hook
 * 
 * Handles notification operations including creation, marking as read,
 * and filtering. Provides convenient utilities for notification management
 * with type safety through JSDoc.
 * 
 * @module useShiftNotifications
 */

import { useCallback, useMemo } from "react";
import { generateId } from "../utils/id";

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique identifier
 * @property {string} type - Notification type (info, warning, error, success)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {boolean} isRead - Whether notification has been read
 * @property {number} timestamp - Creation timestamp
 * @property {string} [shiftId] - Related shift ID (optional)
 * @property {string} [userId] - Related user ID (optional)
 * @property {Object} [metadata] - Additional metadata (optional)
 */

/**
 * @typedef {Object} NotificationFilter
 * @property {string} [type] - Filter by notification type
 * @property {boolean} [isRead] - Filter by read status
 * @property {string} [shiftId] - Filter by related shift
 * @property {string} [userId] - Filter by related user
 */

/**
 * Hook for notification management
 * @param {Object} state - Current shift state
 * @param {Object} actions - State action functions
 * @returns {Object} Notification utilities
 */
export function useShiftNotifications(state, actions) {

  /**
   * Create a new notification
   * @param {string} type - Notification type (info, warning, error, success)
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [options] - Additional options
   * @param {string} [options.shiftId] - Related shift ID
   * @param {string} [options.userId] - Related user ID
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Notification} Created notification
   */
  const createNotification = useCallback((type, title, message, options = {}) => {
    const notification = {
      id: generateId(),
      type,
      title,
      message,
      isRead: false,
      timestamp: Date.now(),
      ...options,
    };

    actions.addNotification(notification);
    return notification;
  }, [actions]);

  /**
   * Create an info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [options] - Additional options
   * @returns {Notification} Created notification
   */
  const notifyInfo = useCallback((title, message, options = {}) => {
    return createNotification("info", title, message, options);
  }, [createNotification]);

  /**
   * Create a success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [options] - Additional options
   * @returns {Notification} Created notification
   */
  const notifySuccess = useCallback((title, message, options = {}) => {
    return createNotification("success", title, message, options);
  }, [createNotification]);

  /**
   * Create a warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [options] - Additional options
   * @returns {Notification} Created notification
   */
  const notifyWarning = useCallback((title, message, options = {}) => {
    return createNotification("warning", title, message, options);
  }, [createNotification]);

  /**
   * Create an error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} [options] - Additional options
   * @returns {Notification} Created notification
   */
  const notifyError = useCallback((title, message, options = {}) => {
    return createNotification("error", title, message, options);
  }, [createNotification]);

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of notification to mark as read
   */
  const markNotificationRead = useCallback((notificationId) => {
    actions.markNotificationRead(notificationId);
  }, [actions]);

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsRead = useCallback(() => {
    actions.markAllNotificationsRead();
  }, [actions]);

  /**
   * Delete a notification
   * @param {string} notificationId - ID of notification to delete
   */
  const deleteNotification = useCallback((notificationId) => {
    actions.deleteNotification(notificationId);
  }, [actions]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    actions.setNotifications([]);
  }, [actions]);

  /**
   * Filter notifications based on criteria
   * @param {NotificationFilter} filter - Filter criteria
   * @returns {Notification[]} Filtered notifications
   */
  const filterNotifications = useCallback((filter = {}) => {
    return state.notifications.filter(notification => {
      if (filter.type && notification.type !== filter.type) {
        return false;
      }
      if (filter.isRead !== undefined && notification.isRead !== filter.isRead) {
        return false;
      }
      if (filter.shiftId && notification.shiftId !== filter.shiftId) {
        return false;
      }
      if (filter.userId && notification.userId !== filter.userId) {
        return false;
      }
      return true;
    });
  }, [state.notifications]);

  /**
   * Get unread notifications
   * @returns {Notification[]} Unread notifications
   */
  const getUnreadNotifications = useCallback(() => {
    return filterNotifications({ isRead: false });
  }, [filterNotifications]);

  /**
   * Get notifications by type
   * @param {string} type - Notification type
   * @returns {Notification[]} Notifications of specified type
   */
  const getNotificationsByType = useCallback((type) => {
    return filterNotifications({ type });
  }, [filterNotifications]);

  /**
   * Get notifications for a specific shift
   * @param {string} shiftId - Shift ID
   * @returns {Notification[]} Notifications for the shift
   */
  const getShiftNotifications = useCallback((shiftId) => {
    return filterNotifications({ shiftId });
  }, [filterNotifications]);

  /**
   * Get notifications for a specific user
   * @param {string} userId - User ID
   * @returns {Notification[]} Notifications for the user
   */
  const getUserNotifications = useCallback((userId) => {
    return filterNotifications({ userId });
  }, [filterNotifications]);

  /**
   * Create notification for shift assignment
   * @param {string} shiftId - Shift ID
   * @param {string} assignedTo - User assigned to shift
   * @param {string} assignedBy - User who made the assignment
   */
  const notifyShiftAssigned = useCallback((shiftId, assignedTo, assignedBy) => {
    createNotification(
      "success",
      "Shift Assigned",
      `Shift ${shiftId} has been assigned to ${assignedTo}`,
      {
        shiftId,
        userId: assignedTo,
        metadata: { assignedBy, action: "shift_assigned" },
      }
    );
  }, [createNotification]);

  /**
   * Create notification for shift application
   * @param {string} shiftId - Shift ID
   * @param {string} applicantId - User who applied
   */
  const notifyShiftApplication = useCallback((shiftId, applicantId) => {
    createNotification(
      "info",
      "New Shift Application",
      `User ${applicantId} has applied for shift ${shiftId}`,
      {
        shiftId,
        userId: applicantId,
        metadata: { action: "shift_application" },
      }
    );
  }, [createNotification]);

  /**
   * Create notification for shift cancellation
   * @param {string} shiftId - Shift ID
   * @param {string} reason - Cancellation reason
   */
  const notifyShiftCancelled = useCallback((shiftId, reason = "") => {
    createNotification(
      "warning",
      "Shift Cancelled",
      `Shift ${shiftId} has been cancelled${reason ? `: ${reason}` : ""}`,
      {
        shiftId,
        metadata: { action: "shift_cancelled", reason },
      }
    );
  }, [createNotification]);

  /**
   * Create notification for conflict detection
   * @param {string} shiftId - Shift ID with conflicts
   * @param {Array} conflicts - Array of conflicts
   */
  const notifyShiftConflicts = useCallback((shiftId, conflicts) => {
    createNotification(
      "warning",
      "Shift Conflicts Detected",
      `Shift ${shiftId} has ${conflicts.length} conflict(s)`,
      {
        shiftId,
        metadata: { action: "shift_conflicts", conflicts },
      }
    );
  }, [createNotification]);

  // Computed properties
  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.isRead).length;
  }, [state.notifications]);

  const notificationsByType = useMemo(() => {
    return state.notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = [];
      }
      acc[notification.type].push(notification);
      return acc;
    }, {});
  }, [state.notifications]);

  const hasUnreadNotifications = useMemo(() => {
    return unreadCount > 0;
  }, [unreadCount]);

  const latestNotification = useMemo(() => {
    if (state.notifications.length === 0) return null;
    return state.notifications.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }, [state.notifications]);

  return {
    // Notification operations
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,

    // Convenience methods
    notifyInfo,
    notifySuccess,
    notifyWarning,
    notifyError,

    // Domain-specific notifications
    notifyShiftAssigned,
    notifyShiftApplication,
    notifyShiftCancelled,
    notifyShiftConflicts,

    // Filtering and querying
    filterNotifications,
    getUnreadNotifications,
    getNotificationsByType,
    getShiftNotifications,
    getUserNotifications,

    // Computed properties
    unreadCount,
    notificationsByType,
    hasUnreadNotifications,
    latestNotification,

    // Raw data access
    notifications: state.notifications,
  };
}