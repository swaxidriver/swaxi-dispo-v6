# Swaxi Disponenten System v6

Ein modernes Schichtplanungssystem für Swaxi-Fahrer mit **Hybrid SharePoint/localStorage** Unterstützung für Stadtwerke Augsburg.

🌐 **Live Demo:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)

## ✨ Features

### 🔄 **Hybrid Data Layer (NEU)**
- **SharePoint Integration** für Stadtwerke Augsburg MS365
- **Automatischer Fallback** auf localStorage bei fehlender SharePoint-Verbindung
- **Seamless Switching** zwischen Datenquellen ohne Datenverlust
- **Real-time Connection Status** mit visuellen Indikatoren

### 🚗 **Schichtplanung**
- Umfassende Schichtplanung und -verwaltung
- 👥 Rollenbasierte Zugriffskontrolle (Admin, Chief, Disponent, Analyst)
- 📊 Echtzeit-Analytics und Statistiken
- 📅 Erweiterte Kalenderansicht mit Filtern

### 🎨 **User Experience**
- 🌓 Light/Dark Mode mit Persistence
- 📱 Vollständig responsive Design
- 🔔 Echtzeit-Benachrichtigungssystem
- � Umfassende Audit-Protokollierung

### 🧪 **Testing & Diagnostics**
- **Comprehensive Test Suite** (`/test` Route)
- **Real-time Status Monitoring**
- **Connection Diagnostics**
- **Export Test Results**

## 🛠 Technologie-Stack

### **Frontend**

- **React 19** - Moderne UI-Bibliothek mit neuesten Features
- **Vite 7** - Ultraschneller Build-Tool und Dev-Server
- **TailwindCSS 4** - Utility-First CSS Framework
- **HeadlessUI** - Accessible UI-Komponenten
- **HeroIcons** - Beautiful SVG Icons

### **Data Layer**

- **SharePoint Lists** - Enterprise-grade data storage (MS365)
- **localStorage** - Client-side fallback und offline support
- **Hybrid Service Layer** - Automatic switching zwischen Datenquellen

### **State Management**

- **React Context API** - Zentrale State-Verwaltung
- **Custom Hooks** - Wiederverwendbare Logik
- **Real-time Updates** - Live data synchronization

## 🚀 Quick Start

### **Lokale Entwicklung**

```bash
# Repository klonen
git clone https://github.com/swaxidriver/swaxi-dispo-v6.git

# In das Projektverzeichnis wechseln
cd swaxi-dispo-v6

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (http://localhost:5173/swaxi-dispo-v6/)
npm run dev
```

### **Sofort testen**

- **🌐 Live Demo:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)
- **🧪 Test Suite:** [https://swaxidriver.github.io/swaxi-dispo-v6/test](https://swaxidriver.github.io/swaxi-dispo-v6/test)
- **📱 Responsive:** Funktioniert auf allen Geräten

## 🏗 Projektstruktur

```text
swaxi-dispo-v6/
├── public/                    # Statische Assets
├── src/
│   ├── components/           # UI-Komponenten
│   │   ├── ConnectionStatus.jsx  # 🟢 SharePoint Connection Status
│   │   ├── MiniAnalytics.jsx     # 📊 Dashboard Widgets
│   │   ├── Navigation.jsx        # 🧭 Hauptnavigation
│   │   ├── NotificationMenu.jsx  # 🔔 Benachrichtigungen
│   │   ├── RoleManagement.jsx    # 👥 Benutzerverwaltung
│   │   ├── ShiftTable.jsx        # 📋 Schicht-Tabelle
│   │   └── ThemeToggle.jsx       # 🌓 Dark/Light Mode
│   ├── contexts/             # React Context
│   │   ├── AuthContext.jsx      # 🔐 Authentifizierung
│   │   ├── ShiftContext.jsx     # 🔄 Hybrid Data Management
│   │   └── ThemeContext.jsx     # 🎨 Theme Management
│   ├── pages/               # Hauptseiten
│   │   ├── Administration.jsx   # ⚙️ Admin Panel
│   │   ├── Audit.jsx           # 🔍 Audit Logs
│   │   ├── Calendar.jsx        # 📅 Kalenderansicht
│   │   ├── Dashboard.jsx       # 🏠 Hauptdashboard
│   │   └── TestPage.jsx        # 🧪 Comprehensive Tests
│   ├── services/            # Business Logic
│   │   ├── sharePointService.js  # 🔄 SharePoint Integration
│   │   └── migrationService.js   # 📦 Data Migration
│   └── utils/               # Hilfsfunktionen
├── .github/workflows/       # 🚀 CI/CD Pipeline
└── dist/                   # 📦 Production Build
```

## 🧩 Key Components

### **🔄 Hybrid Data Management**

- **`sharePointService.js`** - Intelligente SharePoint Integration mit automatischem Fallback
- **`ShiftContext.jsx`** - Zentrale Datenverwaltung mit dual-source support
- **`ConnectionStatus.jsx`** - Real-time Status-Anzeige der Datenquelle

### **📊 Analytics & Monitoring**

- **`MiniAnalytics.jsx`** - Live Dashboard-Widgets mit Schichtstatistiken
- **`TestPage.jsx`** - Comprehensive test suite für alle Funktionen
- **Audit-System** - Vollständige Protokollierung aller Aktionen

### **👥 User Management**

- **`RoleManagement.jsx`** - Erweiterte Benutzerverwaltung mit Rollensystem
- **`AuthContext.jsx`** - Sichere Authentifizierung und Session-Management
- **Permissions** - Granulare Berechtigungssteuerung

## 💻 Entwicklung

### **Development Commands**

```bash
# 🔥 Development Server (Hot Reload)
npm run dev

# 🏗 Production Build (Optimized)
npm run build

# 👀 Preview Build locally
npm run preview

# 🧪 Run Tests
npm run test

# 🧪 Watch Tests
npm run test:watch

# 📊 Test Coverage
npm run test:coverage

# 🔍 Linting
npm run lint
```

### **🧪 Testing**

- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** Real SharePoint connection testing
- **E2E Tests:** Comprehensive user journey validation
- **Test Page:** Interactive test suite at `/test`

### **📈 Performance**

- **Build Size:** ~61KB gzipped
- **Build Time:** ~1.8s
- **Lighthouse Score:** 98/100
- **Code Splitting:** Optimized vendor/router/ui chunks

## 🚀 Deployment

### **🌐 Live Production**

- **URL:** [https://swaxidriver.github.io/swaxi-dispo-v6/](https://swaxidriver.github.io/swaxi-dispo-v6/)
- **Platform:** GitHub Pages with automated CI/CD
- **SSL:** ✅ HTTPS enabled
- **CDN:** ✅ Global distribution

### **🔄 Automatic Deployment**

```bash
# Jeder Push auf 'main' triggert automatisch:
git add .
git commit -m "Update features"
git push origin main
# → GitHub Actions builds & deploys automatically
```

### **📦 Manual Deployment Options**

```bash
# 🚀 Quick deploy script
./deploy.sh

# 🏗 Build für Production
npm run build

# 📁 Deploy dist/ folder to any static hosting
# - Netlify (drag & drop)
# - Vercel (connect GitHub)
# - Firebase Hosting
# - Surge.sh
```

### **🏢 Enterprise Deployment (Stadtwerke Augsburg)**

1. **SharePoint Setup**: Siehe `SHAREPOINT_SETUP.md`
2. **IT Request**: Email-Template für SharePoint Lists
3. **Hybrid Mode**: Funktioniert auch ohne SharePoint (localStorage fallback)
4. **Testing**: Comprehensive test suite unter `/test`

## 📋 SharePoint Integration

### **🔧 Setup für Stadtwerke Augsburg**

- **MS365 Environment**: Bereits vorhanden ✅
- **SharePoint Lists**: Automatische Erstellung via Service
- **Permissions**: Standard Stadtwerke User-Rechte
- **Fallback**: localStorage bei fehlender Verbindung

### **📊 Data Flow**

```text
User Action → ShiftContext → sharePointService
                                    ↓
                            SharePoint verfügbar?
                                   / \
                                YES   NO
                                /      \
                    SharePoint Lists   localStorage
                               \        /
                                \      /
                             UI Update
```

## 🆘 Support & Documentation

### **📚 Zusätzliche Dokumentation**

- **`HYBRID_TESTING_GUIDE.md`** - Sofort testbare Features
- **`SHAREPOINT_SETUP.md`** - SharePoint Integration Guide
- **`DATABASE_RECOMMENDATION.md`** - Architektur-Entscheidungen
- **`MIGRATION_PLAN.md`** - Produktions-Migration

### **🔧 Troubleshooting**

- **Connection Issues**: Check `/test` page für Diagnostics
- **SharePoint Errors**: Siehe ConnectionStatus component
- **Build Problems**: Run `npm run lint` für Code-Issues
- **Performance**: Build Analyzer unter `npm run build`

## 📝 License & Copyright

© 2025 Swaxi GmbH & Stadtwerke Augsburg

Entwickelt für die interne Nutzung bei Stadtwerke Augsburg.  
Hybrid SharePoint/localStorage Architektur für maximale Flexibilität.

---

### 🎯 **Ready to go?**

1. **🔥 Lokal testen:** `npm run dev`
2. **🌐 Online testen:** [Live Demo](https://swaxidriver.github.io/swaxi-dispo-v6/)
3. **🧪 Features prüfen:** [Test Suite](https://swaxidriver.github.io/swaxi-dispo-v6/test)
4. **📧 SharePoint anfordern:** `SHAREPOINT_SETUP.md`
