/**
 * useShiftSync - Synchronization and Persistence Hook
 * 
 * Handles online/offline synchronization, localStorage persistence,
 * and repository management. Manages the offline action queue and
 * automatic syncing when connectivity is restored.
 * 
 * @module useShiftSync
 */

import { useEffect, useRef, useCallback } from "react";
import { getShiftRepository } from "../repository/repositoryFactory";
import { checkShiftConflicts } from "../utils/shifts";
import { validateShiftArray } from "../utils/validation";
import { applyInitialSeedIfEmpty } from "../seed/initialData";
import {
  enqueue,
  drain as drainQueue,
  peekQueue,
} from "../services/offlineQueue";

/**
 * Hook for synchronization and persistence management
 * @param {Object} state - Current shift state
 * @param {Object} actions - State action functions
 * @param {Object} refs - Reference objects for tracking state
 * @param {Object} config - Configuration options
 * @returns {Object} Sync utilities and repository reference
 */
export function useShiftSync(state, actions, refs, config = {}) {
  const {
    disableAsyncBootstrap = false,
    heartbeatMs = 15000,
    enableAsyncInTests = false,
    repositoryOverride = null,
    initialShifts = null,
  } = config;

  const repoRef = useRef(null);
  const actionsRef = useRef(actions);
  
  // Keep actions ref updated
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  /**
   * Initialize repository
   */
  useEffect(() => {
    try {
      repoRef.current = repositoryOverride || getShiftRepository();
    } catch (error) {
      console.warn("Failed to initialize repository:", error);
      repoRef.current = null;
    }
  }, [repositoryOverride]);

  /**
   * Enqueue action for offline processing
   * @param {Object} action - Action to enqueue
   */
  const enqueueOfflineAction = useCallback((action) => {
    enqueue(action);
  }, []);

  /**
   * Save state to localStorage
   */
  const saveToLocalStorage = useCallback(() => {
    try {
      localStorage.setItem("shifts", JSON.stringify(state.shifts));
      localStorage.setItem("applications", JSON.stringify(state.applications));
      localStorage.setItem("notifications", JSON.stringify(state.notifications));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }, [state.shifts, state.applications, state.notifications]);

  /**
   * Load initial data from localStorage
   */
  const loadFromLocalStorage = useCallback(() => {
    try {
      const lsShifts = localStorage.getItem("shifts");
      if (lsShifts) {
        const parsed = JSON.parse(lsShifts);
        if (Array.isArray(parsed) && parsed.length && !refs.bootstrapped.current) {
          const withConflicts = parsed.map((s) => ({
            ...s,
            conflicts: checkShiftConflicts(
              s,
              parsed.filter((o) => o.id !== s.id),
              [],
            ),
          }));
          actionsRef.current.initShifts(withConflicts);
          refs.bootstrapped.current = true;
        }
      }

      const lsApps = localStorage.getItem("applications");
      if (lsApps) {
        try {
          actionsRef.current.initApplications(JSON.parse(lsApps));
        } catch {
          /* ignore */
        }
      }

      const lsNotes = localStorage.getItem("notifications");
      if (lsNotes) {
        try {
          actionsRef.current.initNotifications(JSON.parse(lsNotes));
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
    }
  }, [refs.bootstrapped]);

  /**
   * Bootstrap with initial shifts if provided
   */
  useEffect(() => {
    if (initialShifts && initialShifts.length && !refs.seeded.current) {
      const withConflicts = initialShifts.map((s) => ({
        ...s,
        conflicts: checkShiftConflicts(
          s,
          initialShifts.filter((o) => o.id !== s.id),
          [],
        ),
      }));
      actions.initShifts(withConflicts);
      refs.seeded.current = true;
      refs.bootstrapped.current = true;
    }
  }, [initialShifts, state.shifts.length, refs]);

  /**
   * Load data from localStorage on mount
   */
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  /**
   * Bootstrap from repository if enabled
   */
  useEffect(() => {
    let cancelled = false;

    async function bootstrapAsync() {
      if (cancelled || refs.bootstrapped.current || disableAsyncBootstrap) {
        return;
      }

      if (!enableAsyncInTests && process.env.NODE_ENV === "test") {
        return;
      }

      try {
        if (repoRef.current?.loadShifts) {
          const loaded = await repoRef.current.loadShifts();
          if (cancelled) return;

          if (Array.isArray(loaded) && loaded.length) {
            const validated = validateShiftArray(loaded);
            if (validated.length) {
              const withConflicts = validated.map((s) => ({
                ...s,
                conflicts: checkShiftConflicts(
                  s,
                  validated.filter((o) => o.id !== s.id),
                  [],
                ),
              }));
              actions.initShifts(withConflicts);
              refs.bootstrapped.current = true;
            }
          }
        }

        // Apply seed data if no shifts loaded
        if (state.shifts.length === 0 && !refs.seeded.current) {
          applyInitialSeedIfEmpty(actionsRef.current.initShifts);
          refs.seeded.current = true;
          refs.bootstrapped.current = true;
        }
      } catch (error) {
        console.warn("Failed to bootstrap from repository:", error);
        
        // Apply seed data as fallback
        if (state.shifts.length === 0 && !refs.seeded.current) {
          applyInitialSeedIfEmpty(actionsRef.current.initShifts);
          refs.seeded.current = true;
          refs.bootstrapped.current = true;
        }
      }
    }

    bootstrapAsync();
    return () => {
      cancelled = true;
    };
  }, [
    disableAsyncBootstrap,
    enableAsyncInTests,
    state.shifts.length,
    refs,
  ]);

  /**
   * Auto-save to localStorage when data changes
   */
  useEffect(() => {
    if (refs.bootstrapped.current) {
      saveToLocalStorage();
    }
  }, [state.shifts, state.applications, state.notifications, saveToLocalStorage, refs.bootstrapped]);

  /**
   * Monitor online status and sync offline queue
   */
  useEffect(() => {
    let stopped = false;

    function updateOnlineStatus() {
      actionsRef.current.setOnline(navigator.onLine);
    }

    // Set initial online status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Periodic online check and queue drain
    const interval = setInterval(async () => {
      if (stopped) return;

      updateOnlineStatus();

      // Drain offline queue if online
      if (navigator.onLine) {
        try {
          const queueItems = peekQueue();
          await Promise.allSettled(
            queueItems.map(async (act) => {
              if (act.type === "create") {
                try {
                  await repoRef.current?.createShift?.(act.payload.shift);
                  actionsRef.current.updateShift({
                    ...act.payload.shift,
                    pendingSync: false,
                  });
                } catch {
                  // Re-enqueue if still failing
                  enqueue(act);
                }
              } else if (act.type === "apply") {
                try {
                  await repoRef.current?.applyToShift?.(
                    act.payload.shiftId,
                    act.payload.userId,
                  );
                } catch {
                  enqueue(act);
                }
              } else if (act.type === "assign") {
                try {
                  await repoRef.current?.assignShift?.(
                    act.payload.shiftId,
                    act.payload.user,
                  );
                } catch {
                  enqueue(act);
                }
              } else if (act.type === "update") {
                try {
                  await repoRef.current?.updateShift?.(act.payload.shift);
                } catch {
                  enqueue(act);
                }
              } else if (act.type === "cancel") {
                try {
                  await repoRef.current?.cancelShift?.(act.payload.shiftId);
                } catch {
                  enqueue(act);
                }
              } else if (act.type === "withdraw") {
                try {
                  await repoRef.current?.withdrawApplication?.(act.payload.applicationId);
                } catch {
                  enqueue(act);
                }
              }
            })
          );
          drainQueue(); // Clear processed items
        } catch (error) {
          console.warn("Failed to sync offline queue:", error);
        }
      }
    }, heartbeatMs);

    return () => {
      stopped = true;
      clearInterval(interval);
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [heartbeatMs]); // Remove actions from dependencies to avoid infinite loop

  /**
   * Restore state from snapshot
   * @param {Object} snapshot - Snapshot data to restore
   */
  const restoreFromSnapshot = useCallback((snapshot) => {
    if (!snapshot || !snapshot.data) return;
    
    const {
      shifts = [],
      applications = [],
      notifications = [],
      lastActivity = Date.now(),
    } = snapshot.data;

    // Recompute conflicts for restored shifts
    const normalized = shifts.map((s) => {
      const conflicts = checkShiftConflicts(s, shifts.filter((o) => o.id !== s.id), applications);
      return { ...s, conflicts };
    });

    // Update state
    actionsRef.current.initShifts(normalized);
    actionsRef.current.initApplications(applications);
    actionsRef.current.initNotifications(notifications);
    actionsRef.current.setLastActivity(lastActivity);

    refs.bootstrapped.current = true;
  }, [refs]);

  /**
   * Create snapshot of current state
   * @returns {Object} Snapshot data
   */
  const createSnapshot = useCallback(() => {
    return {
      timestamp: Date.now(),
      data: {
        shifts: state.shifts,
        applications: state.applications,
        notifications: state.notifications,
        lastActivity: state.lastActivity,
      },
    };
  }, [state]);

  /**
   * Force sync with repository
   * @returns {Promise<boolean>} Success status
   */
  const forceSync = useCallback(async () => {
    if (!state.isOnline || !repoRef.current) {
      return false;
    }

    try {
      // Push pending changes
      const pendingShifts = state.shifts.filter(s => s.pendingSync);
      await Promise.allSettled(
        pendingShifts.map(shift => repoRef.current.updateShift(shift))
      );

      // Mark as synced
      pendingShifts.forEach(shift => {
        actionsRef.current.updateShift({ ...shift, pendingSync: false });
      });

      return true;
    } catch (error) {
      console.error("Failed to force sync:", error);
      return false;
    }
  }, [state.isOnline, state.shifts]);

  return {
    repository: repoRef.current,
    enqueueOfflineAction,
    restoreFromSnapshot,
    createSnapshot,
    forceSync,
    loadFromLocalStorage,
    saveToLocalStorage,
  };
}