import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

// Lightweight feedback collection for test users. Persists locally and exposes export.
// Shape: { id, message, category, userId, role, ts, appVersion, commit }

const FeedbackContext = createContext(null);

function safeGetGlobals() {
  /* global __APP_VERSION__, __APP_COMMIT__ */
  const appVersion =
    typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
  const commit =
    typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "local";
  return { appVersion, commit };
}

export function FeedbackProvider({ children, onNewFeedback }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("feedback_items");
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("feedback_items", JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addFeedback = useCallback(
    (message, { category = "general", user } = {}) => {
      if (!message || !message.trim()) return { ok: false, reason: "empty" };
      const { appVersion, commit } = safeGetGlobals();
      const entry = {
        id: "fb_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        message: message.trim(),
        category,
        userId: user?.id || user?.name || null,
        role: user?.role || "anonymous",
        ts: Date.now(),
        appVersion,
        commit,
      };
      setItems((prev) => [entry, ...prev]);
      close();
      // External callback (e.g. to push notification) provided by parent
      try {
        onNewFeedback?.(entry);
      } catch {
        /* ignore */
      }
      return { ok: true, id: entry.id };
    },
    [close, onNewFeedback],
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const value = useMemo(
    () => ({ items, isOpen, open, close, addFeedback, exportJson }),
    [items, isOpen, open, close, addFeedback, exportJson],
  );
  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
}

export default FeedbackContext;
