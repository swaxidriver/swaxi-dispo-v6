import { useState, useRef, useEffect, useCallback } from "react";

// Helper to format date consistently for display
const formatDateForDisplay = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ApplicationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  shift = null,
  shifts = [],
  isMultiple = false,
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastActiveRef = useRef(null);
  const panelRef = useRef(null);

  // Focus management: save last active element when modal opens, restore when closes
  useEffect(() => {
    if (isOpen) {
      lastActiveRef.current = document.activeElement;
    }
    if (!isOpen && lastActiveRef.current) {
      // Use setTimeout to ensure focus after modal unmount
      setTimeout(() => {
        if (
          lastActiveRef.current &&
          typeof lastActiveRef.current.focus === "function"
        ) {
          lastActiveRef.current.focus();
        }
      }, 0);
    }
  }, [isOpen]);

  // Clear comment when modal closes
  useEffect(() => {
    if (!isOpen) {
      setComment("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
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
    [onClose],
  );

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(comment.trim());
      onClose();
    } catch (error) {
      console.error("Application failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const shiftCount = isMultiple ? shifts.length : 1;
  const shiftText = shiftCount === 1 ? "Dienst" : "Dienste";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      style={{ padding: "var(--space-4)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-desc"
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
          <h2 id="confirmation-title" className="text-lg font-semibold">
            Bewerbung bestätigen
          </h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="text-gray-600 hover:text-gray-900 focus:outline-brand-accent"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div>
          <p id="confirmation-desc" className="text-sm text-gray-600 mb-4">
            {isMultiple
              ? `Sie bewerben sich für ${shiftCount} ${shiftText}. Möchten Sie fortfahren?`
              : `Sie bewerben sich für diesen ${shiftText}. Möchten Sie fortfahren?`}
          </p>

          {isMultiple && shifts.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Ausgewählte Dienste:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {shifts.slice(0, 5).map((s, index) => (
                  <li key={s.id || index}>
                    {formatDateForDisplay(s.date)} - {s.start} bis {s.end}
                    {s.type && ` (${s.type})`}
                  </li>
                ))}
                {shifts.length > 5 && (
                  <li className="text-gray-500">
                    ... und {shifts.length - 5} weitere
                  </li>
                )}
              </ul>
            </div>
          )}

          {!isMultiple && shift && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Dienst:
              </h4>
              <p className="text-sm text-gray-600">
                {formatDateForDisplay(shift.date)} - {shift.start} bis{" "}
                {shift.end}
                {shift.type && ` (${shift.type})`}
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="application-comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kommentar (optional)
            </label>
            <textarea
              id="application-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="block w-full rounded border-gray-300 shadow-sm"
              placeholder="Zusätzliche Informationen zu Ihrer Bewerbung..."
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-end"
          style={{ gap: "var(--space-2)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
            style={{
              paddingLeft: "var(--space-3)",
              paddingRight: "var(--space-3)",
              paddingTop: "var(--space-1)",
              paddingBottom: "var(--space-1)",
            }}
            disabled={isSubmitting}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              paddingLeft: "var(--space-3)",
              paddingRight: "var(--space-3)",
              paddingTop: "var(--space-1)",
              paddingBottom: "var(--space-1)",
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Bewerbe..." : "Bewerben"}
          </button>
        </div>
      </div>
    </div>
  );
}
