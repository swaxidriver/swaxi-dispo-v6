/**
 * Accessibility utilities for keyboard navigation and ARIA support
 */

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container) {
    if (!container) return [];

    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="option"]',
      '[role="listitem"][tabindex="0"]',
    ].join(",");

    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  /**
   * Move focus to next/previous focusable element
   */
  moveFocus(container, direction = "next", currentElement = null) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return null;

    let currentIndex = currentElement
      ? focusableElements.indexOf(currentElement)
      : -1;

    let nextIndex;
    if (direction === "next") {
      nextIndex =
        currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
    } else {
      nextIndex =
        currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement) {
      nextElement.focus();
      return nextElement;
    }
    return null;
  },

  /**
   * Create a focus trap for modals/dialogs
   */
  createFocusTrap(container) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return null;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  },
};

/**
 * ARIA utilities for drag and drop
 */
export const dragDropAria = {
  /**
   * Set drag state ARIA attributes
   */
  setDragState(element, isDragging = false, isGrabbed = false) {
    if (!element) return;

    element.setAttribute("aria-grabbed", isGrabbed.toString());

    if (isDragging) {
      element.setAttribute("aria-describedby", "drag-instructions");
    } else {
      element.removeAttribute("aria-describedby");
    }
  },

  /**
   * Set drop zone ARIA attributes
   */
  setDropZoneState(element, canDrop = false, isActive = false) {
    if (!element) return;

    // Don't override existing roles like 'option'
    if (!element.getAttribute("role")) {
      element.setAttribute("role", "region");
    }
    element.setAttribute("aria-dropeffect", canDrop ? "move" : "none");

    const existingLabel = element.getAttribute("aria-label");
    if (isActive) {
      element.setAttribute(
        "data-drop-state",
        "Aktive Ablagezone - Loslassen zum Zuweisen",
      );
    } else if (canDrop) {
      element.setAttribute(
        "data-drop-state",
        "Ablagezone für Schichtzuweisung",
      );
    } else {
      element.setAttribute("data-drop-state", "Nicht verfügbare Ablagezone");
    }
  },

  /**
   * Announce drag and drop status to screen readers
   */
  announceStatus(message, priority = "polite") {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardNav = {
  /**
   * Handle arrow key navigation in a grid/list
   */
  handleArrowKeys(e, container, currentElement, options = {}) {
    const {
      orientation = "both", // 'horizontal', 'vertical', 'both'
      wrap = true,
      itemSelector = '[role="option"], [tabindex="0"]',
    } = options;

    const items = Array.from(container.querySelectorAll(itemSelector));
    const currentIndex = items.indexOf(currentElement);

    if (currentIndex === -1) return null;

    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          e.preventDefault();
          nextIndex =
            wrap && currentIndex + 1 >= items.length
              ? 0
              : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          e.preventDefault();
          nextIndex =
            wrap && currentIndex - 1 < 0
              ? items.length - 1
              : Math.max(currentIndex - 1, 0);
        }
        break;
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          e.preventDefault();
          nextIndex =
            wrap && currentIndex + 1 >= items.length
              ? 0
              : Math.min(currentIndex + 1, items.length - 1);
        }
        break;
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          e.preventDefault();
          nextIndex =
            wrap && currentIndex - 1 < 0
              ? items.length - 1
              : Math.max(currentIndex - 1, 0);
        }
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
      default:
        return null;
    }

    const nextElement = items[nextIndex];
    if (nextElement && nextIndex !== currentIndex) {
      nextElement.focus();
      return nextElement;
    }

    return null;
  },
};

/**
 * Skip link utilities
 */
export const skipLinks = {
  /**
   * Create a skip link
   */
  createSkipLink(targetId, text, container = document.body) {
    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className =
      "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-blue-600 focus:text-white focus:no-underline";

    // Insert as first child
    container.insertBefore(skipLink, container.firstChild);

    return skipLink;
  },
};

/**
 * Screen reader only utility class
 */
export const srOnlyClass = "sr-only";

/**
 * Live region for dynamic content announcements
 */
export class LiveRegion {
  constructor(priority = "polite") {
    this.element = document.createElement("div");
    this.element.setAttribute("aria-live", priority);
    this.element.setAttribute("aria-atomic", "true");
    this.element.className = "sr-only";
    document.body.appendChild(this.element);
  }

  announce(message) {
    this.element.textContent = message;
  }

  destroy() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
