/**
 * useShiftState - Core State Management Hook
 * 
 * Handles the core state management for shifts, applications, and notifications.
 * This hook encapsulates the reducer logic and provides a clean interface
 * for state updates.
 * 
 * @module useShiftState
 */

import { useReducer, useRef } from "react";
import { initialState, shiftReducer } from "../contexts/ShiftContextCore";

/**
 * @typedef {Object} ShiftState
 * @property {Array} shifts - Array of shifts
 * @property {Array} applications - Array of applications  
 * @property {Array} notifications - Array of notifications
 * @property {Object} filters - Current filter settings
 * @property {string} dataSource - Current data source
 * @property {boolean} isOnline - Online status
 * @property {number|null} lastSync - Last sync timestamp
 * @property {number|null} lastActivity - Last activity timestamp
 * @property {Object|null} undoState - Undo state for operations
 */

/**
 * Hook for managing core shift state
 * @param {ShiftState} [overrideInitialState] - Override the initial state
 * @returns {{state: ShiftState, dispatch: Function, refs: Object}} State and dispatch
 */
export function useShiftState(overrideInitialState = null) {
  const [state, dispatch] = useReducer(
    shiftReducer, 
    overrideInitialState || initialState
  );

  // Refs for tracking bootstrap status
  const seededRef = useRef(false);
  const bootstrappedRef = useRef(false);

  /**
   * Initialize shifts with conflict detection
   * @param {Array} shifts - Array of shifts to initialize
   */
  const initShifts = (shifts) => {
    dispatch({ type: "INIT_SHIFTS", payload: shifts });
  };

  /**
   * Set shifts (replaces all shifts)
   * @param {Array} shifts - Array of shifts
   */
  const setShifts = (shifts) => {
    dispatch({ type: "SET_SHIFTS", payload: shifts });
  };

  /**
   * Add a single shift
   * @param {Object} shift - Shift to add
   */
  const addShift = (shift) => {
    dispatch({ type: "ADD_SHIFT", payload: shift });
  };

  /**
   * Update an existing shift
   * @param {Object} updatedShift - Updated shift data
   */
  const updateShift = (updatedShift) => {
    dispatch({ type: "UPDATE_SHIFT", payload: updatedShift });
  };

  /**
   * Assign a shift to a user
   * @param {string} id - Shift ID
   * @param {string} user - User to assign to
   */
  const assignShift = (id, user) => {
    dispatch({ type: "ASSIGN_SHIFT", payload: { id, user } });
  };

  /**
   * Initialize applications
   * @param {Array} applications - Array of applications
   */
  const initApplications = (applications) => {
    dispatch({ type: "INIT_APPLICATIONS", payload: applications });
  };

  /**
   * Add a single application
   * @param {Object} application - Application to add
   */
  const addApplication = (application) => {
    dispatch({ type: "ADD_APPLICATION", payload: application });
  };

  /**
   * Add multiple applications (for series applications)
   * @param {Array} applications - Array of applications to add
   */
  const addSeriesApplication = (applications) => {
    dispatch({ type: "ADD_SERIES_APPLICATION", payload: applications });
  };

  /**
   * Update an existing application
   * @param {Object} updatedApplication - Updated application data
   */
  const updateApplication = (updatedApplication) => {
    dispatch({ type: "UPDATE_APPLICATION", payload: updatedApplication });
  };

  /**
   * Initialize notifications
   * @param {Array} notifications - Array of notifications
   */
  const initNotifications = (notifications) => {
    dispatch({ type: "INIT_NOTIFICATIONS", payload: notifications });
  };

  /**
   * Add a notification
   * @param {Object} notification - Notification to add
   */
  const addNotification = (notification) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: notification });
  };

  /**
   * Set all notifications (replaces existing)
   * @param {Array} notifications - Array of notifications
   */
  const setNotifications = (notifications) => {
    dispatch({ type: "SET_NOTIFICATIONS", payload: notifications });
  };

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of notification to mark as read
   */
  const markNotificationRead = (notificationId) => {
    dispatch({ type: "MARK_NOTIFICATION_READ", payload: notificationId });
  };

  /**
   * Mark all notifications as read
   */
  const markAllNotificationsRead = () => {
    dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
  };

  /**
   * Delete a notification
   * @param {string} notificationId - ID of notification to delete
   */
  const deleteNotification = (notificationId) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
  };

  /**
   * Update filter settings
   * @param {Object} filterUpdates - Partial filter updates
   */
  const updateFilters = (filterUpdates) => {
    dispatch({ type: "UPDATE_FILTERS", payload: filterUpdates });
  };

  /**
   * Set online status
   * @param {boolean} isOnline - Online status
   */
  const setOnline = (isOnline) => {
    dispatch({ type: "SET_ONLINE", payload: isOnline });
  };

  /**
   * Set last activity timestamp
   * @param {number} timestamp - Activity timestamp
   */
  const setLastActivity = (timestamp) => {
    dispatch({ type: "SET_LAST_ACTIVITY", payload: timestamp });
  };

  /**
   * Set undo state
   * @param {Object} undoState - State for undo operation
   */
  const setUndoState = (undoState) => {
    dispatch({ type: "SET_UNDO_STATE", payload: undoState });
  };

  /**
   * Clear undo state
   */
  const clearUndoState = () => {
    dispatch({ type: "CLEAR_UNDO_STATE" });
  };

  return {
    state,
    dispatch,
    refs: {
      seeded: seededRef,
      bootstrapped: bootstrappedRef,
    },
    actions: {
      // Shift actions
      initShifts,
      setShifts,
      addShift,
      updateShift,
      assignShift,
      
      // Application actions
      initApplications,
      addApplication,
      addSeriesApplication,
      updateApplication,
      
      // Notification actions
      initNotifications,
      addNotification,
      setNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      
      // Filter and status actions
      updateFilters,
      setOnline,
      setLastActivity,
      
      // Undo actions
      setUndoState,
      clearUndoState,
    },
  };
}