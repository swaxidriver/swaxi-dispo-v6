/**
 * useShiftOperations - Business Operations Hook
 * 
 * Handles high-level business operations for shifts including creation,
 * application, assignment, and cancellation. Uses pure domain functions
 * and coordinates with state management.
 * 
 * @module useShiftOperations
 */

import { useCallback } from "react";
import * as ShiftOps from "../lib/shift-operations";
import { checkShiftConflicts } from "../utils/shifts";
import { enhance_shift_with_datetime } from "../utils/time-utils";
import { buildShiftId } from "../contexts/ShiftContextCore";
import { generateId } from "../utils/id";
import AuditService from "../services/auditService";

/**
 * Hook for shift business operations
 * @param {Object} state - Current shift state
 * @param {Object} actions - State action functions
 * @param {Object} repository - Repository for persistence
 * @param {Function} enqueueOfflineAction - Function to enqueue offline actions
 * @returns {Object} Operation functions
 */
export function useShiftOperations(state, actions, repository, enqueueOfflineAction) {
  
  /**
   * Create a new shift with validation and conflict detection
   * @param {Object} shiftData - Shift creation data
   * @returns {Promise<{ok: boolean, id: string, uid: string}>} Creation result
   */
  const createShift = useCallback(async (shiftData) => {
    try {
      // Use domain function for creation
      const { shift } = ShiftOps.createShift(shiftData, state.shifts, state.applications);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_created", {
        shiftId: shift.id,
        type: shift.type,
        date: shift.date,
      });

      // Add to state
      actions.addShift(shift);

      // Try to persist online
      if (state.isOnline && repository?.createShift) {
        try {
          await repository.createShift(shift);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "create",
            payload: { shift },
            ts: Date.now(),
          });
          actions.updateShift({ ...shift, pendingSync: true });
        }
      } else {
        // Queue for when online
        enqueueOfflineAction({
          type: "create",
          payload: { shift },
          ts: Date.now(),
        });
        actions.updateShift({ ...shift, pendingSync: true });
      }

      return { ok: true, id: shift.id, uid: shift.uid };
    } catch (error) {
      console.error("Failed to create shift:", error);
      throw error;
    }
  }, [state.shifts, state.applications, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Apply to a single shift
   * @param {string} shiftId - ID of shift to apply to
   * @param {string} userId - ID of applying user
   * @returns {Promise<{ok: boolean, applicationId: string}>} Application result
   */
  const applyToShift = useCallback(async (shiftId, userId) => {
    try {
      // Use domain function for application
      const { application } = ShiftOps.applyToShift(shiftId, userId, state.shifts, state.applications);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_application_created", {
        shiftId,
        userId,
        applicationId: application.id,
      });

      // Add to state
      actions.addApplication(application);

      // Try to persist online
      if (state.isOnline && repository?.applyToShift) {
        try {
          await repository.applyToShift(shiftId, userId);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "apply",
            payload: { shiftId, userId },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "apply",
          payload: { shiftId, userId },
          ts: Date.now(),
        });
      }

      return { ok: true, applicationId: application.id };
    } catch (error) {
      console.error("Failed to apply to shift:", error);
      throw error;
    }
  }, [state.shifts, state.applications, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Apply to multiple shifts in a series
   * @param {string[]} shiftIds - Array of shift IDs
   * @param {string} userId - ID of applying user  
   * @returns {Promise<{ok: boolean, applicationIds: string[]}>} Application result
   */
  const applyToSeries = useCallback(async (shiftIds, userId) => {
    try {
      // Use domain function for series application
      const applications = ShiftOps.applyToSeries(shiftIds, userId, state.shifts, state.applications);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_series_application_created", {
        shiftIds,
        userId,
        applicationIds: applications.map(app => app.id),
      });

      // Add to state
      actions.addSeriesApplication(applications);

      // Try to persist online
      if (state.isOnline && repository?.applyToSeries) {
        try {
          await repository.applyToSeries(shiftIds, userId);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "applySeries",
            payload: { shiftIds, userId },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "applySeries",
          payload: { shiftIds, userId },
          ts: Date.now(),
        });
      }

      return { ok: true, applicationIds: applications.map(app => app.id) };
    } catch (error) {
      console.error("Failed to apply to shift series:", error);
      throw error;
    }
  }, [state.shifts, state.applications, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Withdraw an application
   * @param {string} applicationId - ID of application to withdraw
   * @returns {Promise<{ok: boolean}>} Withdrawal result
   */
  const withdrawApplication = useCallback(async (applicationId) => {
    try {
      // Use domain function for withdrawal
      const updatedApplication = ShiftOps.withdrawApplication(applicationId, state.applications);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_application_withdrawn", {
        applicationId,
        shiftId: updatedApplication.shiftId,
      });

      // Update state
      actions.updateApplication(updatedApplication);

      // Try to persist online
      if (state.isOnline && repository?.withdrawApplication) {
        try {
          await repository.withdrawApplication(applicationId);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "withdraw",
            payload: { applicationId },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "withdraw",
          payload: { applicationId },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to withdraw application:", error);
      throw error;
    }
  }, [state.applications, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Assign a shift to a user
   * @param {string} shiftId - ID of shift to assign
   * @param {string} user - User to assign to
   * @returns {Promise<{ok: boolean}>} Assignment result
   */
  const assignShift = useCallback(async (shiftId, user) => {
    try {
      // Use domain function for assignment
      const updatedShift = ShiftOps.assignShift(shiftId, user, state.shifts);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_assigned", {
        shiftId,
        assignedTo: user,
      });

      // Update state
      actions.updateShift(updatedShift);

      // Try to persist online
      if (state.isOnline && repository?.assignShift) {
        try {
          await repository.assignShift(shiftId, user);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "assign",
            payload: { shiftId, user },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "assign",
          payload: { shiftId, user },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to assign shift:", error);
      throw error;
    }
  }, [state.shifts, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Cancel a shift
   * @param {string} shiftId - ID of shift to cancel
   * @returns {Promise<{ok: boolean}>} Cancellation result
   */
  const cancelShift = useCallback(async (shiftId) => {
    try {
      // Use domain function for cancellation
      const updatedShift = ShiftOps.cancelShift(shiftId, state.shifts);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_cancelled", {
        shiftId,
      });

      // Update state
      actions.updateShift(updatedShift);

      // Try to persist online
      if (state.isOnline && repository?.cancelShift) {
        try {
          await repository.cancelShift(shiftId);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "cancel",
            payload: { shiftId },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "cancel",
          payload: { shiftId },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to cancel shift:", error);
      throw error;
    }
  }, [state.shifts, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Update shift status
   * @param {string} shiftId - ID of shift to update
   * @param {string} newStatus - New status
   * @returns {Promise<{ok: boolean}>} Update result
   */
  const updateShiftStatus = useCallback(async (shiftId, newStatus) => {
    try {
      // Use domain function for status update
      const updatedShift = ShiftOps.updateShiftStatus(shiftId, newStatus, state.shifts);
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_status_updated", {
        shiftId,
        newStatus,
        previousStatus: state.shifts.find(s => s.id === shiftId)?.status,
      });

      // Update state
      actions.updateShift(updatedShift);

      // Try to persist online
      if (state.isOnline && repository?.updateShift) {
        try {
          await repository.updateShift(updatedShift);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "update",
            payload: { shift: updatedShift },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "update",
          payload: { shift: updatedShift },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to update shift status:", error);
      throw error;
    }
  }, [state.shifts, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Update a shift with new data
   * @param {Object} updatedShift - Updated shift data
   * @returns {Promise<{ok: boolean}>} Update result
   */
  const updateShift = useCallback(async (updatedShift) => {
    try {
      // Store undo state
      const originalShift = state.shifts.find(s => s.id === updatedShift.id);
      if (originalShift) {
        actions.setUndoState({ 
          type: "shift_update", 
          data: originalShift,
          timestamp: Date.now(),
        });
      }

      // Recalculate conflicts for updated shift
      const enhancedShift = enhance_shift_with_datetime(updatedShift);
      const conflicts = checkShiftConflicts(
        enhancedShift,
        state.shifts.filter(s => s.id !== updatedShift.id),
        state.applications
      );
      const shiftWithConflicts = { ...enhancedShift, conflicts };

      // Audit logging
      AuditService.logCurrentUserAction("shift_updated", {
        shiftId: updatedShift.id,
        changes: Object.keys(updatedShift),
      });

      // Update state
      actions.updateShift(shiftWithConflicts);
      actions.setLastActivity(Date.now());

      // Try to persist online
      if (state.isOnline && repository?.updateShift) {
        try {
          await repository.updateShift(shiftWithConflicts);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "update",
            payload: { shift: shiftWithConflicts },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "update",
          payload: { shift: shiftWithConflicts },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to update shift:", error);
      throw error;
    }
  }, [state.shifts, state.applications, state.isOnline, actions, repository, enqueueOfflineAction]);

  /**
   * Undo the last shift update
   * @returns {Promise<{ok: boolean}>} Undo result
   */
  const undoLastShiftUpdate = useCallback(async () => {
    try {
      if (!state.undoState || state.undoState.type !== "shift_update") {
        throw new Error("No shift update to undo");
      }

      const originalShift = state.undoState.data;
      
      // Audit logging
      AuditService.logCurrentUserAction("shift_update_undone", {
        shiftId: originalShift.id,
      });

      // Restore original shift
      actions.updateShift(originalShift);
      actions.clearUndoState();

      // Try to persist online
      if (state.isOnline && repository?.updateShift) {
        try {
          await repository.updateShift(originalShift);
        } catch (error) {
          // Queue for offline sync
          enqueueOfflineAction({
            type: "update",
            payload: { shift: originalShift },
            ts: Date.now(),
          });
        }
      } else {
        enqueueOfflineAction({
          type: "update",
          payload: { shift: originalShift },
          ts: Date.now(),
        });
      }

      return { ok: true };
    } catch (error) {
      console.error("Failed to undo shift update:", error);
      throw error;
    }
  }, [state.undoState, state.isOnline, actions, repository, enqueueOfflineAction]);

  return {
    createShift,
    applyToShift,
    applyToSeries,
    withdrawApplication,
    assignShift,
    cancelShift,
    updateShiftStatus,
    updateShift,
    undoLastShiftUpdate,
  };
}