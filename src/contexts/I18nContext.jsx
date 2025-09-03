import { createContext, useReducer, useEffect } from "react";

import { useLocalStorage } from "../hooks";

// Simple i18n dictionary as suggested in docs
const I18N_DICT = {
  de: {
    // Navigation
    overview: "Übersicht",
    calendar: "Kalender",
    administration: "Verwaltung",
    audit: "Audit",
    settings: "Einstellungen",
    test: "🧪 Test",

    // Settings page
    settingsTitle: "Einstellungen",
    language: "Sprache",
    theme: "Design",
    role: "Rolle",
    timeFormat: "Zeitformat",
    notifications: "Benachrichtigungen",
    conflictRules: "Konfliktregeln",
    autosaveInterval: "Autospeichern-Intervall",
    dangerZone: "Gefahrenbereich",

    // Notification options
    enableNotifications: "Benachrichtigungen aktivieren",

    // Theme options
    light: "Hell",
    dark: "Dunkel",
    system: "System",

    // Time format options
    format24h: "24h",
    formatAmPm: "AM/PM",

    // Roles
    admin: "Administrator",
    chief: "Einsatzleiter",
    disponent: "Disponent",
    analyst: "Analyst",

    // Actions
    save: "Speichern",
    cancel: "Abbrechen",
    reset: "Zurücksetzen",
    export: "Exportieren",
    resetDemoData: "Demo-Daten zurücksetzen",
    exportJson: "JSON exportieren",

    // Other common strings
    reload: "Neu laden",
    updateAvailable: "Neue Version verfügbar",
    loading: "Laden...",

    // Intervals
    seconds: "Sekunden",
    interval15s: "15 Sekunden",
    interval30s: "30 Sekunden",
    interval60s: "60 Sekunden",

    // Weekday names
    monday: "Montag",
    tuesday: "Dienstag",
    wednesday: "Mittwoch",
    thursday: "Donnerstag",
    friday: "Freitag",
    saturday: "Samstag",
    sunday: "Sonntag",

    // Short weekday names
    mon: "Mo",
    tue: "Di",
    wed: "Mi",
    thu: "Do",
    fri: "Fr",
    sat: "Sa",
    sun: "So",

    // Month names
    january: "Januar",
    february: "Februar",
    march: "März",
    april: "April",
    may: "Mai",
    june: "Juni",
    july: "Juli",
    august: "August",
    september: "September",
    october: "Oktober",
    november: "November",
    december: "Dezember",

    // Date/Time formats and labels
    dateFormat: "DD.MM.YYYY",
    timeFormatPattern: "HH:mm",
    dateTimeFormat: "DD.MM.YYYY HH:mm",
    today: "Heute",
    yesterday: "Gestern",
    tomorrow: "Morgen",

    // Audit page
    accessDenied: "Zugriff verweigert",
    auditAccessDenied:
      "Sie haben keine Berechtigung, das Audit-Log einzusehen.",
    allActivities: "Alle Aktivitäten",
    creations: "Erstellungen",
    updates: "Änderungen",

    // AutosaveManager
    dataRestoreSuccess: "Daten erfolgreich wiederhergestellt",
    dataRestoreFailed: "Wiederherstellung fehlgeschlagen",
    snapshotFrom: "Snapshot vom",
    dataSource: "Datenquelle",

    // Shift management
    shiftExistsAlready: "Dienst existiert bereits",
    workLocationRequired: "Arbeitsort erforderlich",
    errorCreatingShift: "Fehler beim Erstellen des Dienstes",
    shiftCreatedSuccessfully: "Dienst erfolgreich erstellt!",
    createNewShift: "Neuen Dienst erstellen",

    // Dashboard
    dashboard: "Dashboard",
    dashboardDescription: "Überblick über alle Dienste und Aktivitäten",
    automaticAssignment: "Automatisch zuteilen",
    automaticAssignmentEasterEgg:
      "Easter Egg: Automatische Zuteilung... Nein, das machen wir doch lieber manuell! 😉",
    currentShifts: "Aktuelle Dienste",

    // Quick Filters
    filterToday: "Heute",
    filter7Days: "7 Tage",
    filterOpen: "Offen",
    filterAssigned: "Zugewiesen",
    filterCancelled: "Abgesagt",
  },
  en: {
    // Navigation
    overview: "Overview",
    calendar: "Calendar",
    administration: "Administration",
    audit: "Audit",
    settings: "Settings",
    test: "🧪 Test",

    // Settings page
    settingsTitle: "Settings",
    language: "Language",
    theme: "Theme",
    role: "Role",
    timeFormat: "Time Format",
    notifications: "Notifications",
    conflictRules: "Conflict Rules",
    autosaveInterval: "Autosave Interval",
    dangerZone: "Danger Zone",

    // Notification options
    enableNotifications: "Enable notifications",

    // Theme options
    light: "Light",
    dark: "Dark",
    system: "System",

    // Time format options
    format24h: "24h",
    formatAmPm: "AM/PM",

    // Roles
    admin: "Administrator",
    chief: "Chief",
    disponent: "Dispatcher",
    analyst: "Analyst",

    // Actions
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    export: "Export",
    resetDemoData: "Reset Demo Data",
    exportJson: "Export JSON",

    // Other common strings
    reload: "Reload",
    updateAvailable: "New version available",
    loading: "Loading...",

    // Intervals
    seconds: "seconds",
    interval15s: "15 seconds",
    interval30s: "30 seconds",
    interval60s: "60 seconds",

    // Weekday names
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",

    // Short weekday names
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",

    // Month names
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",

    // Date/Time formats and labels
    dateFormat: "MM/DD/YYYY",
    timeFormatPattern: "h:mm A",
    dateTimeFormat: "MM/DD/YYYY h:mm A",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",

    // Audit page
    accessDenied: "Access Denied",
    auditAccessDenied: "You do not have permission to view the audit log.",
    allActivities: "All Activities",
    creations: "Creations",
    updates: "Updates",

    // AutosaveManager
    dataRestoreSuccess: "Data successfully restored",
    dataRestoreFailed: "Data restore failed",
    snapshotFrom: "Snapshot from",
    dataSource: "Data source",

    // Shift management
    shiftExistsAlready: "Shift already exists",
    workLocationRequired: "Work location required",
    errorCreatingShift: "Error creating shift",
    shiftCreatedSuccessfully: "Shift created successfully!",
    createNewShift: "Create New Shift",

    // Dashboard
    dashboard: "Dashboard",
    dashboardDescription: "Overview of all shifts and activities",
    automaticAssignment: "Auto Assign",
    automaticAssignmentEasterEgg:
      "Easter Egg: Automatic assignment... No, let's do it manually! 😉",
    currentShifts: "Current Shifts",

    // Quick Filters
    filterToday: "Today",
    filter7Days: "7 Days",
    filterOpen: "Open",
    filterAssigned: "Assigned",
    filterCancelled: "Cancelled",
  },
};

const I18nContext = createContext();

const initialState = {
  language: "de", // Default to German as specified
  dictionary: I18N_DICT,
};

function i18nReducer(state, action) {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.payload };
    default:
      return state;
  }
}

export function I18nProvider({ children }) {
  const [storedLanguage, setStoredLanguage] = useLocalStorage(
    "swaxi.settings.language",
    "de",
  );
  const [state, dispatch] = useReducer(i18nReducer, {
    ...initialState,
    language: storedLanguage,
  });

  // Save language changes to localStorage (only when language changes)
  useEffect(() => {
    setStoredLanguage(state.language);
  }, [state.language, setStoredLanguage]);

  const setLanguage = (language) => {
    dispatch({ type: "SET_LANGUAGE", payload: language });
  };

  // Translation helper function - returns key if translation not found (fallback behavior)
  const t = (key) => {
    const translation = state.dictionary[state.language]?.[key];
    return translation || key;
  };

  const value = {
    language: state.language,
    setLanguage,
    t,
    availableLanguages: Object.keys(state.dictionary),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };
