import React from "react";

/**
 * Universal loading spinner with accessibility support
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether loading state is active
 * @param {string} props.loadingText - Screen reader text for loading state
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg'
 * @param {string} props.variant - Visual variant: 'spinner', 'dots', 'pulse'
 * @param {React.ReactNode} props.children - Content to show when not loading
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement}
 */
export function LoadingSpinner({
  isLoading = false,
  loadingText = "Lädt...",
  size = "md",
  variant = "spinner",
  children,
  className = "",
  ...props
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const spinnerClasses = `animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]}`;
  const dotsClasses = `flex space-x-1 ${size === "sm" ? "text-xs" : size === "lg" ? "text-lg" : ""}`;
  const pulseClasses = `animate-pulse bg-gray-300 rounded ${sizeClasses[size]}`;

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className={dotsClasses} role="status" aria-label={loadingText}>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <span className="sr-only">{loadingText}</span>
          </div>
        );
      case "pulse":
        return (
          <div className={pulseClasses} role="status" aria-label={loadingText}>
            <span className="sr-only">{loadingText}</span>
          </div>
        );
      default:
        return (
          <div
            className={spinnerClasses}
            role="status"
            aria-label={loadingText}
          >
            <span className="sr-only">{loadingText}</span>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        {...props}
      >
        {renderSpinner()}
      </div>
    );
  }

  return children || null;
}

/**
 * Loading button component with disabled state and spinner
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether button is in loading state
 * @param {string} props.loadingText - Text to show during loading
 * @param {React.ReactNode} props.children - Button content when not loading
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @returns {React.ReactElement}
 */
export function LoadingButton({
  isLoading = false,
  loadingText = "Lädt...",
  children,
  onClick,
  className = "",
  disabled = false,
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      className={`btn relative ${className} ${isLoading ? "cursor-not-allowed" : ""}`}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner
          isLoading={true}
          loadingText=""
          size="sm"
          className="absolute inset-0"
        />
      )}
      <span className={isLoading ? "opacity-0" : ""}>{children}</span>
    </button>
  );
}

/**
 * Loading overlay for async content areas
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether overlay should be visible
 * @param {string} props.loadingText - Screen reader text
 * @param {React.ReactNode} props.children - Content to overlay
 * @returns {React.ReactElement}
 */
export function LoadingOverlay({
  isLoading = false,
  loadingText = "Inhalt wird geladen...",
  children,
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white/75 dark:bg-gray-900/75 flex items-center justify-center z-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner
              isLoading={true}
              loadingText={loadingText}
              size="lg"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {loadingText}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default {
  LoadingSpinner,
  LoadingButton,
  LoadingOverlay,
};
