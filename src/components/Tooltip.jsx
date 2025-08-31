import React, { useState, useRef, useEffect } from "react";

/**
 * Lightweight tooltip component with hover and mobile long-press support
 * Repositions automatically to stay within viewport
 */
function Tooltip({
  content,
  children,
  className = "",
  disabled = false,
  ariaLabel,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const longPressRef = useRef(null);
  const touchStartTimeRef = useRef(null);

  // Calculate optimal tooltip position
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + 8; // 8px spacing
    let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Adjust horizontal position to stay in viewport
    if (left < 8) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    // Adjust vertical position if tooltip would go below viewport
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = triggerRect.top - tooltipRect.height - 8; // Position above instead
    }

    setPosition({ top, left });
  };

  // Show tooltip with positioning
  const showTooltip = () => {
    if (disabled) return;
    setIsVisible(true);
    // Calculate position after rendering
    setTimeout(calculatePosition, 0);
  };

  // Hide tooltip
  const hideTooltip = () => {
    setIsVisible(false);
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  // Mouse events for desktop
  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  // Touch events for mobile long-press
  const handleTouchStart = (_e) => {
    touchStartTimeRef.current = Date.now();
    longPressRef.current = setTimeout(() => {
      showTooltip();
    }, 600); // 600ms as specified in requirements
  };

  const handleTouchEnd = (e) => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }

    // If tooltip is visible and user releases touch outside the trigger, hide it
    if (isVisible && touchStartTimeRef.current) {
      const touchDuration = Date.now() - touchStartTimeRef.current;
      if (touchDuration >= 600) {
        // Check if touch ended outside the trigger
        const rect = triggerRef.current?.getBoundingClientRect();
        const touch = e.changedTouches[0];
        if (
          rect &&
          touch &&
          (touch.clientX < rect.left ||
            touch.clientX > rect.right ||
            touch.clientY < rect.top ||
            touch.clientY > rect.bottom)
        ) {
          hideTooltip();
        }
      }
    }
    // Always hide after long-press release (tests expect dismissal)
    hideTooltip();
    touchStartTimeRef.current = null;
  };

  const handleTouchMove = () => {
    // Cancel long-press if user moves finger
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  // Update position on scroll/resize
  useEffect(() => {
    if (isVisible) {
      const updatePosition = () => calculatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible]);

  // Generate stable ID for accessibility
  const tooltipId = useRef(
    `tooltip-${Math.random().toString(36).substr(2, 9)}`,
  );

  // If the child is already an interactive element (button, link, input), do not nest another interactive role
  const childIsInteractive =
    typeof children === "object" &&
    children?.type &&
    (children.type === "button" ||
      children.type === "a" ||
      children.props?.role === "button");

  return (
    <div className={`relative inline-block ${className}`}>
      {childIsInteractive ? (
        (() => {
          const originalOnClick = children.props.onClick;
          const label =
            children.props["aria-label"] ||
            ariaLabel ||
            (typeof content === "string" ? content : undefined);
          return (
            <span
              className="cursor-help inline-flex"
              aria-describedby={isVisible ? tooltipId.current : undefined}
              ref={triggerRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              tabIndex={0}
              role="button"
              aria-label={label}
              title={typeof content === "string" ? content : undefined}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (isVisible) hideTooltip();
                  else showTooltip();
                  if (originalOnClick) originalOnClick(e);
                }
                if (e.key === "Escape") hideTooltip();
              }}
              onClick={(e) => {
                if (originalOnClick) originalOnClick(e);
              }}
            >
              {/* Proxy non-interactive span to avoid nested interactive element */}
              <span className={children.props.className} aria-hidden="true">
                {children.props.children}
              </span>
            </span>
          );
        })()
      ) : (
        <span
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          aria-describedby={isVisible ? tooltipId.current : undefined}
          className="cursor-help inline-flex"
          tabIndex={0}
          aria-label={
            ariaLabel || (typeof content === "string" ? content : undefined)
          }
          title={typeof content === "string" ? content : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (isVisible) {
                hideTooltip();
              } else {
                showTooltip();
              }
            }
            if (e.key === "Escape") {
              hideTooltip();
            }
          }}
          role="button"
        >
          {children}
        </span>
      )}

      {isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          aria-live="polite"
          className="fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none max-w-xs"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {content}
          {/* Small arrow pointing to trigger */}
          <div className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 -top-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
}

export default Tooltip;
