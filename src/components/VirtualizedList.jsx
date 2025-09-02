import { useState, useEffect, useRef, useMemo } from "react";

/**
 * Simple list virtualization component for performance with large datasets
 * Only renders visible items based on container height and item height
 */
function VirtualizedList({
  items,
  itemHeight = 120,
  containerHeight = 600,
  renderItem,
  overscan = 5,
  className = "",
  role = "list",
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate which items are visible
  const visibleRange = useMemo(() => {
    if (!items.length) return { start: 0, end: 0 };

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight),
    );

    // Add overscan to render items slightly outside viewport for smooth scrolling
    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange]);

  // Total height for scrollbar
  const totalHeight = items.length * itemHeight;

  // Handle scroll
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!containerRef.current) return;

    const currentScrollTop = containerRef.current.scrollTop;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        containerRef.current.scrollTop = Math.min(
          currentScrollTop + itemHeight,
          totalHeight - containerHeight,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        containerRef.current.scrollTop = Math.max(
          currentScrollTop - itemHeight,
          0,
        );
        break;
      case "PageDown":
        e.preventDefault();
        containerRef.current.scrollTop = Math.min(
          currentScrollTop + containerHeight,
          totalHeight - containerHeight,
        );
        break;
      case "PageUp":
        e.preventDefault();
        containerRef.current.scrollTop = Math.max(
          currentScrollTop - containerHeight,
          0,
        );
        break;
      case "Home":
        e.preventDefault();
        containerRef.current.scrollTop = 0;
        break;
      case "End":
        e.preventDefault();
        containerRef.current.scrollTop = totalHeight - containerHeight;
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role={role}
      aria-label={`Liste mit ${items.length} Elementen`}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${visibleRange.start * itemHeight}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={item.id || actualIndex}
                style={{ height: itemHeight }}
                role="listitem"
                className="border-b border-gray-200 last:border-b-0"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedList;
