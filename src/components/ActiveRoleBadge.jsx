import { useContext, memo } from "react";

// AuthContext is exported as default from AuthContext.jsx
import AuthContext from "../contexts/AuthContext";
import { ROLES } from "../utils/constants";

import Tooltip from "./Tooltip";

function roleStyle(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "bg-cyan-600 text-white";
    case ROLES.CHIEF:
      return "bg-indigo-600 text-white";
    case ROLES.DISPONENT:
      return "bg-green-600 text-white";
    case ROLES.ANALYST:
      return "bg-gray-600 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

function getRoleCapabilities(role) {
  const capabilities = [];

  switch (role) {
    case ROLES.ADMIN:
      return "Vollzugriff: Verwaltung, Zuweisung, Schichtpläne, Auditprotokoll, Analytik";
    case ROLES.CHIEF:
      return "Führung: Schichtenverwaltung, Zuweisung, Vorlagen, Analytik";
    case ROLES.DISPONENT:
      return "Disposition: Schichtenverwaltung, Bewerbungen";
    case ROLES.ANALYST:
      return "Analytik: Nur Lesezugriff und Auswertungen";
    default:
      return "Keine spezifischen Berechtigungen";
  }
}

function ActiveRoleBadge({ className = "" }) {
  const auth = useContext(AuthContext);
  const role = auth?.user?.role;
  if (!role) return null;

  const capabilities = getRoleCapabilities(role);

  return (
    <Tooltip content={capabilities}>
      <span
        data-testid="active-role-badge"
        aria-label={`Aktive Rolle: ${role} - ${capabilities}`}
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-white/20 ${roleStyle(role)} ${className}`}
      >
        {role}
      </span>
    </Tooltip>
  );
}

export default memo(ActiveRoleBadge);
