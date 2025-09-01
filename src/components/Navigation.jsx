import { NavLink } from "react-router-dom";
// reference to satisfy strict unused var rule in certain test contexts
const _navLinkRef = NavLink;
import { useContext } from "react";

import { useFeedback } from "../contexts/useFeedback";
import AuthContext from "../contexts/AuthContext";
import { canViewAudit } from "../lib/rbac";
import { useI18n } from "../hooks/useI18n";

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
  const navigation = [
    { name: t("overview"), href: "/" },
    { name: t("calendar"), href: "/calendar" },
    isDisponent && { name: "Meine Bewerbungen", href: "/applications" },
    isChief && { name: "Shift Designer", href: "/shift-designer" },
    isAdmin && { name: t("administration"), href: "/admin" },
    canViewAudit(role) && { name: t("audit"), href: "/audit" },
    { name: t("settings"), href: "/settings" },
    { name: t("test"), href: "/test" },
  ].filter(Boolean);

  return (
    <>
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link focus-ring-high-contrast">
        Zum Hauptinhalt springen
      </a>

      <nav
        className="bg-[var(--color-primary)]"
        aria-label="Hauptnavigation"
        data-testid="main-nav"
        role="banner"
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
              <div
                className="hidden sm:flex items-center"
                style={{ marginLeft: "var(--space-6)", gap: "var(--space-8)" }}
                role="navigation"
                aria-label="Hauptnavigation"
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
            <FeedbackNavControl />
          </div>
        </div>
      </nav>
    </>
  );
}

function FeedbackNavControl() {
  // separate component so hook order remains stable if provider absent in isolated tests
  try {
    const fb = useFeedback();
    return (
      <div className="flex items-center">
        <button
          onClick={fb.open}
          data-testid="feedback-btn"
          className="text-sm text-gray-300 hover:text-white border border-transparent hover:border-gray-300 rounded focus-ring-primary transition-colors"
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
      </div>
    );
  } catch {
    return null;
  }
}
