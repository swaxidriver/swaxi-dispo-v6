import { NavLink } from "react-router-dom";
// reference to satisfy strict unused var rule in certain test contexts
const _navLinkRef = NavLink;
import { useContext, useState, useEffect, useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

import { useFeedback } from "../contexts/useFeedback";
import AuthContext from "../contexts/AuthContext";
import { canViewAudit } from "../lib/rbac";
import { useI18n } from "../hooks/useI18n";
import { focusUtils } from "../ui/accessibility";

import ActiveRoleBadge from "./ActiveRoleBadge";
import VersionBadge from "./VersionBadge";

// AuthContext imported above

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navigation() {
  const auth = useContext(AuthContext);
  const { t } = useI18n();
  const role = auth?.user?.role;
  const isAdmin = role === "admin" || role === "chief";
  const isChief = role === "chief" || role === "admin";
  const isDisponent = role === "disponent";

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const hamburgerButtonRef = useRef(null);
  const focusTrapCleanupRef = useRef(null);

  const navigation = [
    { name: t("overview"), href: "/" },
    { name: t("calendar"), href: "/calendar" },
    isDisponent && { name: t("personalApplications"), href: "/applications" },
    isChief && { name: t("shiftDesigner"), href: "/shift-designer" },
    isAdmin && { name: t("administration"), href: "/admin" },
    canViewAudit(role) && { name: t("audit"), href: "/audit" },
    { name: t("settings"), href: "/settings" },
    { name: t("test"), href: "/test" },
  ].filter(Boolean);

  // Handle mobile menu open/close
  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    // Return focus to hamburger button
    if (hamburgerButtonRef.current) {
      hamburgerButtonRef.current.focus();
    }
  };

  // Handle ESC key to close menu
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscKey);
      return () => document.removeEventListener("keydown", handleEscKey);
    }
  }, [isMobileMenuOpen]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      // Setup focus trap
      focusTrapCleanupRef.current = focusUtils.createFocusTrap(
        mobileMenuRef.current,
      );
    }

    return () => {
      // Cleanup focus trap
      if (focusTrapCleanupRef.current) {
        focusTrapCleanupRef.current();
        focusTrapCleanupRef.current = null;
      }
    };
  }, [isMobileMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link focus-ring-high-contrast">
        Zum Hauptinhalt springen
      </a>

      <nav
        className="bg-[var(--color-primary)] safe-top safe-x"
        aria-label="Hauptnavigation"
        data-testid="main-nav"
      >
        <div
          className="mx-auto max-w-7xl"
          style={{
            paddingLeft: "var(--space-4)",
            paddingRight: "var(--space-4)",
          }}
        >
          <div
            className="flex justify-between"
            style={{ height: "var(--space-16)" }}
          >
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-white font-bold text-xl flex items-center">
                  swaxi <VersionBadge />
                </span>
              </div>

              {/* Desktop Navigation */}
              <div
                className="hidden sm:flex items-center"
                style={{ marginLeft: "var(--space-6)", gap: "var(--space-8)" }}
              >
                {navigation.map((item) => {
                  // Generate test ID based on route for consistency
                  const testId = `nav-${item.href === "/" ? "dashboard" : item.href.slice(1)}`;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === "/"}
                      data-testid={testId}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "border-brand-accent text-white"
                            : "border-transparent text-gray-300 hover:border-gray-300 hover:text-white",
                          "inline-flex items-center border-b-2 text-sm font-medium focus-ring-primary transition-colors",
                        )
                      }
                      style={{
                        paddingLeft: "var(--space-1)",
                        paddingTop: "var(--space-1)",
                      }}
                      aria-current={({ isActive }) =>
                        isActive ? "page" : undefined
                      }
                    >
                      {item.name}
                    </NavLink>
                  );
                })}
                <span className="flex-1" aria-hidden="true" />
                {auth?.user && (
                  <ActiveRoleBadge style={{ marginLeft: "var(--space-4)" }} />
                )}
                {!auth?.user && (
                  <NavLink
                    to="/login"
                    data-testid="nav-login"
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? "border-brand-accent text-white"
                          : "border-transparent text-gray-300 hover:border-gray-300 hover:text-white",
                        "inline-flex items-center border-b-2 text-sm font-medium focus-ring-primary transition-colors",
                      )
                    }
                    style={{
                      paddingLeft: "var(--space-1)",
                      paddingTop: "var(--space-1)",
                    }}
                    aria-current={({ isActive }) =>
                      isActive ? "page" : undefined
                    }
                  >
                    Anmelden
                  </NavLink>
                )}
                {auth?.user && (
                  <button
                    onClick={auth.logout}
                    data-testid="nav-logout"
                    className="inline-flex items-center border-b-2 border-transparent text-sm font-medium text-gray-300 hover:text-white hover:border-gray-300 focus-ring-primary transition-colors"
                    aria-label={`Abmelden (${auth.user.role})`}
                    title="Aktuelle Sitzung beenden"
                    style={{
                      paddingLeft: "var(--space-1)",
                      paddingTop: "var(--space-1)",
                    }}
                  >
                    Abmelden ({auth.user.role})
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button and feedback control */}
            <div className="flex items-center">
              {/* Mobile menu button - only visible on small screens */}
              <button
                ref={hamburgerButtonRef}
                type="button"
                className="sm:hidden inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors mobile-nav-toggle"
                style={{
                  padding: "var(--space-3)",
                  minWidth: "44px",
                  minHeight: "44px",
                }}
                onClick={openMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Hauptmenü öffnen"
                data-testid="mobile-nav-toggle"
              >
                <span className="sr-only">Hauptmenü öffnen</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>

              <FeedbackNavControl />
            </div>
          </div>
        </div>

        {/* Mobile menu overlay and panel */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 mobile-menu-overlay"
              style={{ animation: "fadeIn 0.3s ease-out" }}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Mobile menu panel */}
            <div
              ref={mobileMenuRef}
              id="mobile-menu"
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-primary)] shadow-lg mobile-menu-panel"
              style={{
                animation: "slideInLeft 0.3s ease-out",
                paddingTop: "var(--space-4)",
                paddingBottom: "var(--space-4)",
              }}
              role="navigation"
              aria-label="Mobile Hauptnavigation"
              data-testid="mobile-menu"
            >
              {/* Close button */}
              <div className="flex items-center justify-between px-4 pb-4">
                <span className="text-white font-bold text-xl">
                  swaxi <VersionBadge />
                </span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                  style={{
                    padding: "var(--space-2)",
                    minWidth: "44px",
                    minHeight: "44px",
                  }}
                  onClick={closeMobileMenu}
                  aria-label="Hauptmenü schließen"
                  data-testid="mobile-nav-close"
                >
                  <span className="sr-only">Hauptmenü schließen</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              {/* Navigation links */}
              <div className="px-4 space-y-1">
                {navigation.map((item) => {
                  const testId = `mobile-nav-${item.href === "/" ? "dashboard" : item.href.slice(1)}`;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      end={item.href === "/"}
                      data-testid={testId}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? "bg-gray-700 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          "block px-3 py-2 text-base font-medium focus-ring-primary transition-colors",
                        )
                      }
                      style={{
                        minHeight: "44px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "0.375rem",
                      }}
                      onClick={closeMobileMenu}
                      aria-current={({ isActive }) =>
                        isActive ? "page" : undefined
                      }
                    >
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>

              {/* User section */}
              <div className="mt-6 pt-6 px-4 border-t border-gray-700">
                {auth?.user && (
                  <div className="mb-4">
                    <ActiveRoleBadge />
                  </div>
                )}

                {!auth?.user && (
                  <NavLink
                    to="/login"
                    data-testid="mobile-nav-login"
                    className={({ isActive }) =>
                      classNames(
                        isActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "block px-3 py-2 text-base font-medium focus-ring-primary transition-colors",
                      )
                    }
                    style={{
                      minHeight: "44px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "0.375rem",
                    }}
                    onClick={closeMobileMenu}
                    aria-current={({ isActive }) =>
                      isActive ? "page" : undefined
                    }
                  >
                    Anmelden
                  </NavLink>
                )}

                {auth?.user && (
                  <button
                    onClick={() => {
                      auth.logout();
                      closeMobileMenu();
                    }}
                    data-testid="mobile-nav-logout"
                    className="w-full text-left block px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus-ring-primary transition-colors"
                    style={{
                      minHeight: "44px",
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "0.375rem",
                    }}
                    aria-label={`Abmelden (${auth.user.role})`}
                    title="Aktuelle Sitzung beenden"
                  >
                    Abmelden ({auth.user.role})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

function FeedbackNavControl() {
  // separate component so hook order remains stable if provider absent in isolated tests
  try {
    const fb = useFeedback();
    return (
      <button
        onClick={fb.open}
        data-testid="feedback-btn"
        className="text-sm text-gray-300 hover:text-white border border-transparent hover:border-gray-300 rounded focus-ring-primary transition-colors hidden sm:block"
        aria-haspopup="dialog"
        title="Feedback geben / Problem melden"
        style={{
          marginLeft: "var(--space-4)",
          paddingLeft: "var(--space-3)",
          paddingRight: "var(--space-3)",
          paddingTop: "var(--space-1)",
          paddingBottom: "var(--space-1)",
        }}
      >
        Feedback
      </button>
    );
  } catch {
    return null;
  }
}
