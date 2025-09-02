import { useState, useContext, useRef, useEffect, useCallback } from "react";

import AuthContext from "../contexts/AuthContext";
import { useFeedback } from "../contexts/useFeedback";

export default function FeedbackModal() {
  const { isOpen, close, addFeedback, exportJson } = useFeedback();
  const auth = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitted, setSubmitted] = useState(false);
  const lastActiveRef = useRef(null);
  const panelRef = useRef(null);

  // Remember previously focused element
  useEffect(() => {
    if (isOpen) lastActiveRef.current = document.activeElement;
  }, [isOpen]);

  // Restore focus when closed
  useEffect(() => {
    if (!isOpen && lastActiveRef.current) {
      try {
        lastActiveRef.current.focus();
      } catch {
        /* ignore */
      }
    }
  }, [isOpen]);

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab") {
        const nodes =
          panelRef.current?.querySelectorAll(
            'button, [href], select, textarea, input, [tabindex]:not([tabindex="-1"])',
          ) || [];
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [close],
  );

  if (!isOpen) return null;
  const submit = (e) => {
    e.preventDefault();
    const res = addFeedback(message, { category, user: auth?.user });
    if (res.ok) {
      setSubmitted(true);
      setMessage("");
      setCategory("general");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      style={{ padding: "var(--space-4)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      aria-describedby="feedback-desc"
      onKeyDown={handleKey}
    >
      <div
        ref={panelRef}
        className="bg-white rounded shadow max-w-lg w-full"
        style={{
          padding: "var(--space-4)",
          gap: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
        }}
        role="document"
      >
        <div className="flex justify-between items-center">
          <h2 id="feedback-title" className="text-lg font-semibold">
            Feedback geben
          </h2>
          <button
            onClick={close}
            aria-label="Schließen"
            className="text-gray-600 hover:text-gray-900 focus:outline-brand-accent focus-ring-primary"
          >
            ✕
          </button>
        </div>
        <p id="feedback-desc" className="text-sm text-gray-600">
          Dein Feedback hilft uns, die Anwendung zu verbessern.
        </p>
        <form
          onSubmit={submit}
          style={{
            gap: "var(--space-3)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div>
            <label
              htmlFor="fb-category"
              className="block text-sm font-medium text-gray-700"
            >
              Kategorie
            </label>
            <select
              id="fb-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded border-gray-300 shadow-sm focus-ring-primary"
              style={{ marginTop: "var(--space-1)" }}
            >
              <option value="general">Allgemein</option>
              <option value="bug">Bug</option>
              <option value="idea">Idee</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="fb-message"
              className="block text-sm font-medium text-gray-700"
            >
              Nachricht
            </label>
            <textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="block w-full rounded border-gray-300 shadow-sm focus-ring-primary"
              style={{ marginTop: "var(--space-1)" }}
              placeholder="Beschreibe dein Problem oder deine Idee…"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Eingeloggt als: {auth?.user?.role || "Gast"}
            </div>
            <div style={{ gap: "var(--space-2)", display: "flex" }}>
              <button
                type="button"
                onClick={exportJson}
                className="text-xs rounded bg-gray-100 hover:bg-gray-200 focus-ring-primary"
                style={{
                  paddingLeft: "var(--space-2)",
                  paddingRight: "var(--space-2)",
                  paddingTop: "var(--space-1)",
                  paddingBottom: "var(--space-1)",
                }}
              >
                Exportieren
              </button>
              <button
                type="submit"
                disabled={!message.trim()}
                className="rounded bg-brand-accent text-white disabled:opacity-40 focus-ring-accent"
                style={{
                  paddingLeft: "var(--space-3)",
                  paddingRight: "var(--space-3)",
                  paddingTop: "var(--space-1)",
                  paddingBottom: "var(--space-1)",
                }}
              >
                Senden
              </button>
            </div>
          </div>
          {submitted && (
            <p
              className="text-green-600 text-sm"
              role="status"
              aria-live="polite"
            >
              Danke! Feedback gespeichert.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
