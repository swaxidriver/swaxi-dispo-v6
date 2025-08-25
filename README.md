# Swaxi Disponenten System v6

Ein modernes Schichtplanungssystem für Swaxi-Fahrer, entwickelt mit React, Vite und TailwindCSS.

## Features

- 🚗 Umfassende Schichtplanung und -verwaltung
- 👥 Rollenbasierte Zugriffskontrolle (Admin, Chief, Disponent, Analyst)
- 📊 Echtzeit-Analytics und Statistiken
- 🌓 Light/Dark Mode
- 📱 Responsive Design
- 🔔 Echtzeit-Benachrichtigungen
- 📅 Kalenderansicht
- 🔍 Audit-Protokollierung

## Technologie-Stack

- React 19
- Vite 7
- TailwindCSS 4
- HeadlessUI für Komponenten
- HeroIcons für Icons
- Context API für State Management
- LocalStorage für Persistenz

## Installation

```bash
# Repository klonen
git clone https://github.com/swaxidriver/swaxi-dispo-v6.git

# In das Projektverzeichnis wechseln
cd swaxi-dispo-v6

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## Projektstruktur

```
swaxi-dispo-v6/
├── public/               # Statische Assets
├── src/
│   ├── assets/          # Projektspezifische Assets
│   ├── components/      # Wiederverwendbare UI-Komponenten
│   ├── contexts/        # React Context Provider
│   ├── pages/          # Hauptseiten/Routen
│   └── utils/          # Hilfsfunktionen und Konstanten
```

## Komponenten

- `NotificationMenu`: Benachrichtigungssystem mit Statusanzeige
- `MiniAnalytics`: Dashboard-Widget für Schichtstatistiken
- `ThemeToggle`: Theme-Switcher (Light/Dark Mode)
- `ShiftTable`: Tabellarische Übersicht der Schichten
- `RoleManagement`: Benutzerverwaltung und Rollenzuweisung
- `Navigation`: Hauptnavigation mit responsivem Design

## Entwicklung

```bash
# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Build lokal testen
npm run preview
```

## Deployment

Das Projekt ist konfiguriert für den Deployment auf GitHub Pages. Der Base-Path ist in der `vite.config.js` bereits eingestellt.

```bash
# Deployment auf GitHub Pages
npm run deploy
```

## Lizenz

© 2025 Swaxi GmbH. Alle Rechte vorbehalten.
