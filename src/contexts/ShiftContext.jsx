/* global process */
/* eslint-disable import/order */
/**
 * ShiftContext
 * Responsibilities:
 *  - Canonical in-memory shift/application/notification state + conflicts & lastActivity
 *  - Domain operations: create/apply/assign/cancel with guarded status transitions
 *  - Duplicate + required workLocation enforcement and conflict recomputation
 *  - Offline durability (localStorage) & deterministic seeding of initial data
 *  - Offline action queue drain on reconnect (create/apply/assign)
 *  - Snapshot restoration (autosave) rebuilding conflicts & timestamps
 *  - Deterministic id generation (monotonic counter) via generateId
 */
import {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";

import { getShiftRepository } from "../repository/repositoryFactory";
import { checkShiftConflicts, detectShiftOverlap } from "../utils/shifts";
import { enhance_shift_with_datetime } from "../utils/time-utils";
import { validateShiftArray } from "../utils/validation";

import { SHIFT_STATUS } from "../utils/constants";
import { initialState, shiftReducer, buildShiftId } from "./ShiftContextCore";
import { applyInitialSeedIfEmpty } from "../seed/initialData";
import {
  enqueue,
  drain as drainQueue,
  peekQueue,
} from "../services/offlineQueue";
import { STATUS, assertTransition } from "../domain/status";
import { generateId } from "../utils/id";
import { useShiftTemplates } from "./useShiftTemplates";
import AuditService from "../services/auditService";

const ShiftContext = createContext(null);

export function ShiftProvider({
  children,
  disableAsyncBootstrap = false,
  heartbeatMs = 15000,
  enableAsyncInTests = false,
  repositoryOverride = null,
  initialShifts = null,
}) {
  const isTestEnv =
    typeof process !== "undefined" && process.env?.JEST_WORKER_ID !== undefined;
  const tplContext = useShiftTemplates() || {};
  const memoTemplates = useMemo(
    () => tplContext.templates || [],
    [tplContext.templates],
  );

  const [state, dispatch] = useReducer(shiftReducer, initialState);

  const repoRef = useRef(null);
  if (!repoRef.current)
    repoRef.current = repositoryOverride || getShiftRepository();
  const bootstrappedRef = useRef(false);

  // Optional synchronous seed for tests to avoid relying solely on localStorage mocks
  const seededRef = useRef(false);
  useEffect(() => {
    if (
      !seededRef.current &&
      initialShifts &&
      Array.isArray(initialShifts) &&
      initialShifts.length &&
      state.shifts.length === 0
    ) {
      const withConflicts = initialShifts.map((s) => ({
        ...s,
        conflicts: checkShiftConflicts(
          s,
          initialShifts.filter((o) => o.id !== s.id),
          [],
        ),
      }));
      dispatch({ type: "INIT_SHIFTS", payload: withConflicts });
      seededRef.current = true;
      bootstrappedRef.current = true;
    }
  }, [initialShifts, state.shifts.length]);

  useEffect(() => {
    let cancelled = false;

    // 1. Synchronous localStorage bootstrap for legacy tests & offline continuity.
    try {
      const lsShifts = localStorage.getItem("shifts");
      if (lsShifts) {
        const parsed = JSON.parse(lsShifts);
        if (Array.isArray(parsed) && parsed.length) {
          const withConflicts = parsed.map((s) => ({
            ...s,
            conflicts: checkShiftConflicts(
              s,
              parsed.filter((o) => o.id !== s.id),
              [],
            ),
          }));
          dispatch({ type: "INIT_SHIFTS", payload: withConflicts });
          bootstrappedRef.current = true;
        }
      }
      const pApps = localStorage.getItem("applications");
      if (pApps) {
        try {
          dispatch({ type: "INIT_APPLICATIONS", payload: JSON.parse(pApps) });
        } catch {
          /* ignore */
        }
      }
      const pNotes = localStorage.getItem("notifications");
      if (pNotes) {
        try {
          dispatch({ type: "INIT_NOTIFICATIONS", payload: JSON.parse(pNotes) });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    // 2. Async repository load if no shifts were loaded yet.
    async function bootstrapAsync() {
      if (
        cancelled ||
        disableAsyncBootstrap ||
        (isTestEnv && !enableAsyncInTests)
      )
        return;
      if (bootstrappedRef.current) return; // already bootstrapped from LS
      try {
        let loadedShifts = [];
        try {
          loadedShifts = await repoRef.current.list();
        } catch {
          /* repository unavailable */
        }
        if (!loadedShifts || !loadedShifts.length) {
          // Use deterministic seed for first-run stability (P0-1)
          loadedShifts = applyInitialSeedIfEmpty([]);
        }
        loadedShifts = loadedShifts.map((s) => ({
          ...s,
          conflicts: checkShiftConflicts(
            s,
            loadedShifts.filter((o) => o.id !== s.id),
            state.applications,
          ),
        }));
        // Validate (dev/test only logs); filter out obviously malformed entries to prevent downstream errors.
        const validated = validateShiftArray(loadedShifts);
        const env =
          (typeof process !== "undefined" && process?.env?.NODE_ENV) ||
          "development";
        if (validated.length !== loadedShifts.length && env !== "production") {
          console.warn(
            `ShiftProvider: filtered ${loadedShifts.length - validated.length} malformed shift(s).`,
          );
        }
        if (!cancelled) dispatch({ type: "INIT_SHIFTS", payload: validated });
      } catch {
        /* swallow */
      }
    }
    bootstrapAsync();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat ping to repository to update online status (skipped in tests unless explicitly enabled)
  useEffect(() => {
    if ((isTestEnv && !enableAsyncInTests) || heartbeatMs <= 0) return () => {};
    let stopped = false;
    let handle;
    async function loop() {
      if (stopped) return;
      try {
        const res = await repoRef.current?.ping?.();
        if (typeof res === "boolean" && res !== state.isOnline) {
          dispatch({ type: "SET_ONLINE", payload: res });
        }
      } catch {
        if (state.isOnline) dispatch({ type: "SET_ONLINE", payload: false });
      } finally {
        handle = setTimeout(loop, heartbeatMs);
      }
    }
    loop();
    return () => {
      stopped = true;
      if (handle) clearTimeout(handle);
    };
  }, [heartbeatMs, state.isOnline, isTestEnv, enableAsyncInTests]);

  useEffect(() => {
    if (state.shifts.length)
      localStorage.setItem("shifts", JSON.stringify(state.shifts));
  }, [state.shifts]);
  useEffect(() => {
    localStorage.setItem("applications", JSON.stringify(state.applications));
  }, [state.applications]);
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(state.notifications));
  }, [state.notifications]);
  useEffect(() => {
    if (state.lastActivity)
      localStorage.setItem("lastActivity", JSON.stringify(state.lastActivity));
  }, [state.lastActivity]);

  useEffect(() => {
    if (!memoTemplates.length) return;
    const today = new Date();
    const additions = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const iso = date.toISOString().slice(0, 10);
      memoTemplates.forEach((t) => {
        if (t.days?.length) {
          const weekdayMap = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
          const code = weekdayMap[date.getDay()];
          if (!t.days.includes(code)) return;
        }
        const id = buildShiftId(iso, t.name); // Use consistent ID generation
        if (!state.shifts.find((s) => s.id === id)) {
          additions.push({
            id,
            date: iso, // Store as ISO string for consistency
            type: t.name,
            start: t.startTime,
            end: t.endTime,
            status: SHIFT_STATUS.OPEN,
            assignedTo: null,
            workLocation: "office",
            conflicts: [],
            uid: generateId("shf_"), // Add unique ID for future editing support
          });
        }
      });
    }
    if (additions.length) {
      // compute conflicts for new additions only vs existing + new additions
      const combined = [...state.shifts, ...additions];
      const enriched = additions.map((s) => ({
        ...s,
        conflicts: checkShiftConflicts(
          s,
          combined.filter((o) => o.id !== s.id),
          state.applications,
        ),
      }));
      enriched.forEach((s) => dispatch({ type: "ADD_SHIFT", payload: s }));
    }
  }, [memoTemplates, state.shifts, state.applications]);

  // Listen for feedback events to surface as notifications
  useEffect(() => {
    function onFeedback(e) {
      const f = e.detail;
      if (!f) return;
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: "fb_evt_" + f.id,
          title: "Feedback",
          message: f.category + " gespeichert",
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });
    }
    window.addEventListener("swaxi-feedback", onFeedback);
    return () => window.removeEventListener("swaxi-feedback", onFeedback);
  }, []);

  const applyToShift = useCallback(
    (shiftId, userId) => {
      const app = {
        id: `${shiftId}_${userId}`,
        shiftId,
        userId,
        ts: Date.now(),
        status: "pending", // Add default status
      };
      dispatch({ type: "ADD_APPLICATION", payload: app });
      // Recalculate conflicts for that shift
      const target = state.shifts.find((s) => s.id === shiftId);
      if (target) {
        const updated = {
          ...target,
          conflicts: checkShiftConflicts(
            target,
            state.shifts.filter((o) => o.id !== target.id),
            [...state.applications, app],
          ),
        };
        dispatch({ type: "UPDATE_SHIFT", payload: updated });
      }
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `apply_${shiftId}_${Date.now()}`,
          title: "Bewerbung eingereicht",
          message: `Shift ${shiftId} Bewerbung gespeichert`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });
      // Fire & forget repository persistence
      // Repository persistence with offline queue fallback
      const attempt = repoRef.current?.applyToShift?.(shiftId, userId);
      if (attempt && typeof attempt.then === "function") {
        attempt.catch(() => {
          enqueue({
            id: `apply_${app.id}`,
            type: "apply",
            payload: { shiftId, userId },
            ts: Date.now(),
          });
        });
      } else {
        // If no promise returned treat as failure for offline queue
        enqueue({
          id: `apply_${app.id}`,
          type: "apply",
          payload: { shiftId, userId },
          ts: Date.now(),
        });
      }
    },
    [state.shifts, state.applications],
  );

  const applyToSeries = useCallback(
    (shiftIds, userId) => {
      if (!shiftIds.length) return;
      const apps = shiftIds.map((id) => ({
        id: `${id}_${userId}`,
        shiftId: id,
        userId,
        ts: Date.now(),
        status: "pending", // Add default status
      }));
      dispatch({ type: "ADD_SERIES_APPLICATION", payload: apps });

      // Log audit entry for series application
      const shiftDetails = shiftIds
        .map((id) => {
          const shift = state.shifts.find((s) => s.id === id);
          return shift ? `${shift.type} ${shift.date}` : id;
        })
        .join(", ");

      AuditService.logCurrentUserAction(
        "Serienbewerbung eingereicht",
        `Beworben auf ${shiftIds.length} Schichten: ${shiftDetails}`,
        shiftIds.length,
      );

      // Bulk conflict recompute for involved shifts
      shiftIds.forEach((id) => {
        const target = state.shifts.find((s) => s.id === id);
        if (target) {
          const updated = {
            ...target,
            conflicts: checkShiftConflicts(
              target,
              state.shifts.filter((o) => o.id !== target.id),
              [...state.applications, ...apps],
            ),
          };
          dispatch({ type: "UPDATE_SHIFT", payload: updated });
        }
      });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `apply_series_${Date.now()}`,
          title: "Serienbewerbung",
          message: `${shiftIds.length} Bewerbungen gespeichert`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });
    },
    [state.shifts, state.applications],
  );

  const withdrawApplication = useCallback(
    (applicationId) => {
      const application = state.applications.find(
        (app) => app.id === applicationId,
      );
      if (!application) return;

      const updatedApp = {
        ...application,
        status: "withdrawn",
        withdrawnAt: new Date().toISOString(),
      };

      dispatch({ type: "UPDATE_APPLICATION", payload: updatedApp });

      // Add notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `withdraw_${applicationId}_${Date.now()}`,
          title: "Bewerbung zurückgezogen",
          message: `Bewerbung für Dienst ${application.shiftId} zurückgezogen`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });

      // TODO: Add repository persistence when available
    },
    [state.applications],
  );

  const updateShiftStatus = useCallback(
    (shiftId, status) => {
      const shift = state.shifts.find((s) => s.id === shiftId);
      if (shift) {
        try {
          assertTransition(shift.status, status);
        } catch {
          return;
        }
        const updated = { ...shift, status };
        updated.conflicts = checkShiftConflicts(
          updated,
          state.shifts.filter((o) => o.id !== updated.id),
          state.applications,
        );
        dispatch({ type: "UPDATE_SHIFT", payload: updated });
      }
    },
    [state.shifts, state.applications],
  );

  const cancelShift = useCallback(
    (shiftId) => {
      const shift = state.shifts.find((s) => s.id === shiftId);
      if (!shift) return;
      try {
        assertTransition(shift.status, STATUS.CANCELLED);
      } catch {
        return;
      }
      const updated = { ...shift, status: STATUS.CANCELLED };
      updated.conflicts = checkShiftConflicts(
        updated,
        state.shifts.filter((o) => o.id !== updated.id),
        state.applications,
      );
      dispatch({ type: "UPDATE_SHIFT", payload: updated });
    },
    [state.shifts, state.applications],
  );

  const assignShift = useCallback(
    (shiftId, user) => {
      const target = state.shifts.find((s) => s.id === shiftId);
      if (!target) return;
      try {
        assertTransition(target.status, STATUS.ASSIGNED);
      } catch {
        return;
      }
      dispatch({ type: "ASSIGN_SHIFT", payload: { id: shiftId, user } });
      const updated = {
        ...target,
        status: SHIFT_STATUS.ASSIGNED,
        assignedTo: user,
      };
      updated.conflicts = checkShiftConflicts(
        updated,
        state.shifts.filter((o) => o.id !== updated.id),
        state.applications,
      );
      dispatch({ type: "UPDATE_SHIFT", payload: updated });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `${shiftId}_${Date.now()}`,
          title: "Shift assigned",
          message: `${user} wurde Dienst zugewiesen`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });
      const attempt = repoRef.current?.assignShift?.(shiftId, user);
      if (attempt && typeof attempt.then === "function") {
        attempt.catch(() => {
          enqueue({
            id: `assign_${shiftId}_${user}`,
            type: "assign",
            payload: { shiftId, user },
            ts: Date.now(),
          });
        });
      } else {
        enqueue({
          id: `assign_${shiftId}_${user}`,
          type: "assign",
          payload: { shiftId, user },
          ts: Date.now(),
        });
      }
    },
    [state.shifts, state.applications],
  );

  const markNotificationRead = useCallback(
    (id) => dispatch({ type: "MARK_NOTIFICATION_READ", payload: id }),
    [],
  );
  const markAllNotificationsRead = useCallback(
    () => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" }),
    [],
  );

  // Drag & Drop: Update shift date/time with conflict validation and undo support
  const updateShift = useCallback(
    (shiftId, updates) => {
      const currentShift = state.shifts.find((s) => s.id === shiftId);
      if (!currentShift) return { success: false, error: "Shift not found" };

      // Create updated shift
      const updatedShift = { ...currentShift, ...updates };

      // Validate conflicts with other shifts
      const otherShifts = state.shifts.filter((s) => s.id !== shiftId);
      const conflicts = checkShiftConflicts(
        updatedShift,
        otherShifts,
        state.applications,
      );

      // If there are conflicts, prevent the update and return error
      if (conflicts && conflicts.length > 0) {
        const conflictMsg =
          conflicts.length === 1
            ? "Zeitkonflikt mit anderer Schicht"
            : `Zeitkonflikte mit ${conflicts.length} anderen Schichten`;
        return { success: false, error: conflictMsg, conflicts };
      }

      // Store undo state before making changes
      dispatch({ type: "SET_UNDO_STATE", payload: { shift: currentShift } });

      // Update the shift
      const finalShift = { ...updatedShift, conflicts: [] };
      dispatch({ type: "UPDATE_SHIFT", payload: finalShift });

      // Log audit trail
      AuditService.logCurrentUserAction(
        "Schicht verschoben",
        `${finalShift.type} ${finalShift.date} ${finalShift.start}-${finalShift.end}`,
        1,
      );

      // Add success notification
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `move_${shiftId}_${Date.now()}`,
          title: "Schicht verschoben",
          message: `${finalShift.type} erfolgreich verschoben`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });

      return { success: true, shift: finalShift };
    },
    [state.shifts, state.applications],
  );

  // Undo last shift movement
  const undoLastShiftUpdate = useCallback(() => {
    if (state.undoState && state.undoState.shift) {
      const originalShift = state.undoState.shift;
      dispatch({ type: "UPDATE_SHIFT", payload: originalShift });
      dispatch({ type: "CLEAR_UNDO_STATE" });

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `undo_${originalShift.id}_${Date.now()}`,
          title: "Rückgängig",
          message: `${originalShift.type} Verschiebung rückgängig gemacht`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });

      return true;
    }
    return false;
  }, [state.undoState]);

  const createShift = useCallback(
    (partial) => {
      // partial: { date, type, start, end, workLocation }
      const date =
        partial.date instanceof Date ? partial.date : new Date(partial.date);
      const dateIso = date.toISOString().slice(0, 10); // Normalize to ISO string for consistency
      const naturalId = buildShiftId(dateIso, partial.type); // Use consistent ID generation
      if (state.shifts.find((s) => s.id === naturalId)) {
        return { ok: false, reason: "duplicate" };
      }
      // Work location domain rule: explicit empty string is invalid; undefined -> default 'office' for backward compat
      if ("workLocation" in partial) {
        if (partial.workLocation === "") {
          return { ok: false, reason: "workLocation" };
        }
      }
      const resolvedLocation =
        partial.workLocation == null ? "office" : partial.workLocation;
      // Add internal uid for future references (e.g., editing when natural key changes)
      const uid = generateId("shf_");
      const shift = {
        id: naturalId,
        uid,
        date: dateIso, // Store as ISO string for consistency
        type: partial.type,
        start: partial.start,
        end: partial.end,
        status: SHIFT_STATUS.OPEN,
        assignedTo: null,
        workLocation: resolvedLocation,
        conflicts: [],
        pendingSync: false,
      };

      // Enhance shift with datetime fields for cross-midnight support
      const enhancedShift = enhance_shift_with_datetime(shift);

      enhancedShift.conflicts = checkShiftConflicts(
        enhancedShift,
        state.shifts,
        state.applications,
      );
      dispatch({ type: "ADD_SHIFT", payload: enhancedShift });

      // Log audit entry for shift creation
      AuditService.logCurrentUserAction(
        "Schicht erstellt",
        `${partial.type} • ${dateIso} • ${partial.start}-${partial.end} • ${resolvedLocation}`,
        1,
      );

      // Recompute conflicts for existing shifts that overlap with the new shift
      // This ensures all shifts show conflicts bidirectionally
      const overlappingShifts = state.shifts.filter(
        (existingShift) =>
          existingShift.id !== enhancedShift.id &&
          detectShiftOverlap(enhancedShift, existingShift),
      );

      overlappingShifts.forEach((existingShift) => {
        // Enhance existing shift if it doesn't already have datetime fields
        const enhancedExisting = existingShift.start_dt
          ? existingShift
          : enhance_shift_with_datetime(existingShift);

        const updatedShift = {
          ...enhancedExisting,
          conflicts: checkShiftConflicts(
            enhancedExisting,
            [...state.shifts, enhancedShift],
            state.applications,
          ),
        };
        dispatch({ type: "UPDATE_SHIFT", payload: updatedShift });
      });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          id: `create_${naturalId}_${Date.now()}`,
          title: "Dienst erstellt",
          message: `${partial.type} ${partial.start}-${partial.end}`,
          timestamp: new Date().toLocaleString(),
          isRead: false,
        },
      });
      const attempt = repoRef.current?.create?.(shift);
      if (attempt && typeof attempt.then === "function") {
        attempt
          .then((saved) => {
            dispatch({
              type: "UPDATE_SHIFT",
              payload: { ...shift, ...saved, pendingSync: false },
            });
          })
          .catch(() => {
            enqueue({
              id: `create_${naturalId}`,
              type: "create",
              payload: { shift },
              ts: Date.now(),
            });
            dispatch({
              type: "UPDATE_SHIFT",
              payload: { ...shift, pendingSync: true },
            });
          });
      } else {
        enqueue({
          id: `create_${naturalId}`,
          type: "create",
          payload: { shift },
          ts: Date.now(),
        });
        dispatch({
          type: "UPDATE_SHIFT",
          payload: { ...shift, pendingSync: true },
        });
      }
      return { ok: true, id: naturalId, uid };
    },
    [state.shifts, state.applications],
  );

  // Restore full state (shifts, applications, notifications) from autosave snapshot
  const restoreFromSnapshot = useCallback((snapshot) => {
    if (!snapshot || !snapshot.data) return;
    const {
      shifts = [],
      applications = [],
      notifications = [],
      lastActivity = Date.now(),
    } = snapshot.data;
    // Recompute conflicts for restored shifts against each other and applications
    const normalized = shifts.map((s) => {
      const dateObj = s.date instanceof Date ? s.date : new Date(s.date);
      return { ...s, date: dateObj };
    });
    const recomputed = normalized.map((s) => ({
      ...s,
      conflicts: checkShiftConflicts(
        s,
        normalized.filter((o) => o.id !== s.id),
        applications,
      ),
    }));
    dispatch({ type: "INIT_SHIFTS", payload: recomputed });
    dispatch({ type: "INIT_APPLICATIONS", payload: applications });
    dispatch({ type: "INIT_NOTIFICATIONS", payload: notifications });
    // Persist
    try {
      localStorage.setItem("shifts", JSON.stringify(recomputed));
    } catch (_e) {
      /* ignore persistence error */
    }
    try {
      localStorage.setItem("applications", JSON.stringify(applications));
    } catch (_e) {
      /* ignore persistence error */
    }
    try {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } catch (_e) {
      /* ignore persistence error */
    }
    dispatch({ type: "SET_LAST_ACTIVITY", payload: lastActivity });
  }, []);

  // Drain offline queue when coming online
  useEffect(() => {
    if (!state.isOnline) return;
    const current = peekQueue();
    if (!current.length) return;
    let stopped = false;
    (async () => {
      await drainQueue(async (act) => {
        if (stopped) return;
        if (act.type === "create") {
          try {
            const saved = await repoRef.current?.create?.(act.payload.shift);
            if (saved) {
              dispatch({
                type: "UPDATE_SHIFT",
                payload: { ...act.payload.shift, ...saved, pendingSync: false },
              });
            } else {
              dispatch({
                type: "UPDATE_SHIFT",
                payload: { ...act.payload.shift, pendingSync: false },
              });
            }
          } catch {
            // If still failing, re-enqueue for later
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
        }
      });
    })();
    return () => {
      stopped = true;
    };
  }, [state.isOnline, state.shifts]);

  const value = useMemo(
    () => ({
      state,
      shifts: state.shifts,
      dispatch,
      isOnline: state.isOnline,
      repository: repoRef.current, // Expose repository for CSV operations
      applyToShift,
      applyToSeries,
      withdrawApplication,
      updateShiftStatus,
      assignShift,
      cancelShift,
      createShift,
      updateShift,
      undoLastShiftUpdate,
      markNotificationRead,
      markAllNotificationsRead,
      getOpenShifts: () =>
        state.shifts.filter((s) => s.status === SHIFT_STATUS.OPEN),
      getConflictedShifts: () =>
        state.shifts.filter((s) => s.conflicts?.length),
      restoreFromSnapshot,
    }),
    [
      state,
      applyToShift,
      applyToSeries,
      withdrawApplication,
      updateShiftStatus,
      assignShift,
      cancelShift,
      createShift,
      updateShift,
      undoLastShiftUpdate,
      markNotificationRead,
      markAllNotificationsRead,
      restoreFromSnapshot,
    ],
  );

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
}

export { ShiftContext };
