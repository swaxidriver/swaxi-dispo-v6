/**
 * ShiftContext (Refactored)
 * 
 * This is the refactored version of ShiftContext that splits responsibilities
 * into focused hooks while maintaining full backward compatibility.
 * 
 * Responsibilities:
 *  - Orchestrates specialized hooks for different concerns
 *  - Maintains the same public API as the original ShiftContext
 *  - Provides domain functions in a core module for AI consumption
 *  - Improved type safety through JSDoc annotations
 * 
 * @module ShiftContextRefactored
 */

import {
  createContext,
  useMemo,
} from "react";

import { SHIFT_STATUS } from "../utils/constants";
import { useShiftState } from "../hooks/useShiftState";
import { useShiftOperations } from "../hooks/useShiftOperations";
import { useShiftSync } from "../hooks/useShiftSync";
import { useShiftNotifications } from "../hooks/useShiftNotifications";
import * as ShiftOps from "../lib/shift-operations";

const ShiftContext = createContext(null);

/**
 * @typedef {Object} ShiftContextValue
 * @property {Object} state - Current shift state
 * @property {Array} shifts - Array of shifts (convenience access)
 * @property {Function} dispatch - State dispatch function
 * @property {boolean} isOnline - Online status
 * @property {Object} repository - Repository instance
 * @property {Function} applyToShift - Apply to a shift
 * @property {Function} applyToSeries - Apply to multiple shifts
 * @property {Function} withdrawApplication - Withdraw an application
 * @property {Function} updateShiftStatus - Update shift status
 * @property {Function} assignShift - Assign a shift
 * @property {Function} cancelShift - Cancel a shift
 * @property {Function} createShift - Create a new shift
 * @property {Function} updateShift - Update a shift
 * @property {Function} undoLastShiftUpdate - Undo last shift update
 * @property {Function} markNotificationRead - Mark notification as read
 * @property {Function} markAllNotificationsRead - Mark all notifications as read
 * @property {Function} getOpenShifts - Get open shifts
 * @property {Function} getConflictedShifts - Get conflicted shifts
 * @property {Function} restoreFromSnapshot - Restore from snapshot
 */

/**
 * ShiftProvider component that orchestrates all shift-related hooks
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} [props.disableAsyncBootstrap=false] - Disable async bootstrap
 * @param {number} [props.heartbeatMs=15000] - Heartbeat interval for sync
 * @param {boolean} [props.enableAsyncInTests=false] - Enable async in tests
 * @param {Object} [props.repositoryOverride=null] - Repository override
 * @param {Array} [props.initialShifts=null] - Initial shifts data
 * @returns {JSX.Element} Provider component
 */
export function ShiftProvider({
  children,
  disableAsyncBootstrap = false,
  heartbeatMs = 15000,
  enableAsyncInTests = false,
  repositoryOverride = null,
  initialShifts = null,
}) {
  // Core state management
  const { state, dispatch, refs, actions } = useShiftState();

  // Synchronization and persistence
  const {
    repository,
    enqueueOfflineAction,
    restoreFromSnapshot,
    createSnapshot,
    forceSync,
  } = useShiftSync(state, actions, refs, {
    disableAsyncBootstrap,
    heartbeatMs,
    enableAsyncInTests,
    repositoryOverride,
    initialShifts,
  });

  // Business operations
  const operations = useShiftOperations(
    state,
    actions,
    repository,
    enqueueOfflineAction
  );

  // Notification management
  const notifications = useShiftNotifications(state, actions);

  // Memoized context value to maintain referential stability
  const value = useMemo(
    () => ({
      // Core state access (backward compatibility)
      state,
      shifts: state.shifts,
      dispatch,
      isOnline: state.isOnline,
      repository,

      // Business operations
      applyToShift: operations.applyToShift,
      applyToSeries: operations.applyToSeries,
      withdrawApplication: operations.withdrawApplication,
      updateShiftStatus: operations.updateShiftStatus,
      assignShift: operations.assignShift,
      cancelShift: operations.cancelShift,
      createShift: operations.createShift,
      updateShift: operations.updateShift,
      undoLastShiftUpdate: operations.undoLastShiftUpdate,

      // Notification operations
      markNotificationRead: notifications.markNotificationRead,
      markAllNotificationsRead: notifications.markAllNotificationsRead,

      // Convenience getters (backward compatibility)
      getOpenShifts: () => ShiftOps.getOpenShifts(state.shifts),
      getConflictedShifts: () => ShiftOps.getConflictedShifts(state.shifts),

      // Sync operations
      restoreFromSnapshot,
      createSnapshot,
      forceSync,

      // Additional utilities for new consumers
      domain: {
        // Pure domain functions for AI consumption
        ...ShiftOps,
      },
      notifications: {
        // Notification utilities
        ...notifications,
      },
      sync: {
        // Sync utilities
        enqueueOfflineAction,
        createSnapshot,
        forceSync,
      },
    }),
    [
      state,
      dispatch,
      repository,
      operations,
      notifications,
      restoreFromSnapshot,
      createSnapshot,
      forceSync,
      enqueueOfflineAction,
    ]
  );

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
}

export { ShiftContext };

// Export domain functions for direct consumption
export * as ShiftOperations from "../lib/shift-operations";

// Export hooks for advanced usage
export { useShiftState } from "../hooks/useShiftState";
export { useShiftOperations } from "../hooks/useShiftOperations";
export { useShiftSync } from "../hooks/useShiftSync";
export { useShiftNotifications } from "../hooks/useShiftNotifications";