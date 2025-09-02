# Quick Setup Guide: SharePoint Integration for Stadtwerke Augsburg

## 🚀 Step-by-Step Implementation

### Step 1: Request SharePoint Site (Email Template)

```
To: IT-Support@stadtwerke-augsburg.de
Subject: SharePoint Site Request - Schichtplanung Digitalisierung

Hallo IT-Team,

ich möchte eine digitale Lösung für unsere Schichtplanung entwickeln und dafür SharePoint Listen nutzen.

Anfrage:
- SharePoint Site: "Swaxi Disposition"
- Berechtigung: Listen erstellen und verwalten
- Zweck: Digitalisierung der manuellen Schichtplanung
- Nutzer: ~20 Mitarbeiter (Disponenten, Fahrer)

Vorteile:
- Reduziert manuellen Aufwand
- Verbessert Transparenz
- Nutzt vorhandene MS365 Infrastruktur
- Keine zusätzlichen Kosten

Benötigte Listen:
1. Schichten (Shifts)
2. Mitarbeiter (Users)
3. Bewerbungen (Applications)
4. Änderungsprotokoll (Audit)

Vielen Dank!
[Ihr Name]
```

### Step 2: Create SharePoint Lists

#### List 1: "Shifts" (Schichten)

```
Spalten:
- Title (Text) → "Schicht ID"
- ShiftDate (Datum) → "Schichtdatum"
- StartTime (Text) → "Startzeit"
- EndTime (Text) → "Endzeit"
- ShiftType (Auswahl) → "Schichttyp"
  Optionen: Früh, Abend, Nacht
- Status (Auswahl) → "Status"
  Optionen: Offen, Zugewiesen, Abgesagt
- AssignedTo (Person) → "Zugewiesen an"
- WorkLocation (Auswahl) → "Arbeitsort"
  Optionen: Büro, Homeoffice
- Conflicts (Mehrzeiliger Text) → "Konflikte"
```

#### List 2: "Users" (Mitarbeiter)

```
Spalten:
- Title (Text) → "Name"
- Email (Text) → "E-Mail"
- Role (Auswahl) → "Rolle"
  Optionen: Admin, Chief, Disponent, Analyst
- Active (Ja/Nein) → "Aktiv"
- Department (Text) → "Abteilung"
```

#### List 3: "Applications" (Bewerbungen)

```
Spalten:
- Title (Text) → "Bewerbungs ID"
- ShiftID (Nachschlagen in Shifts) → "Schicht"
- ApplicantEmail (Text) → "Bewerber E-Mail"
- ApplicationDate (Datum) → "Bewerbungsdatum"
- Status (Auswahl) → "Status"
  Optionen: Ausstehend, Angenommen, Abgelehnt
- Type (Auswahl) → "Typ"
  Optionen: Einzeln, Serie
```

### Step 3: Update Your React App

#### Replace localStorage with SharePoint:

```javascript
// In your ShiftContext.jsx
import { sharePointService } from "../services/sharePointService";

export function ShiftProvider({ children }) {
  const [state, dispatch] = useReducer(shiftReducer, initialState);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check if SharePoint is available
    sharePointService.isSharePointAvailable().then(setIsOnline);

    // Load shifts
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const shifts = await sharePointService.getShifts();
      dispatch({ type: "SET_SHIFTS", payload: shifts });
    } catch (error) {
      console.error("Error loading shifts:", error);
    }
  };

  const createShift = async (shiftData) => {
    try {
      const newShift = await sharePointService.createShift(shiftData);
      dispatch({ type: "ADD_SHIFT", payload: newShift });

      // Log audit trail
      await sharePointService.logAudit("SHIFT_CREATED", {
        shiftId: newShift.id,
        date: shiftData.date,
      });
    } catch (error) {
      console.error("Error creating shift:", error);
    }
  };

  return (
    <ShiftContext.Provider
      value={{
        state,
        dispatch,
        createShift,
        loadShifts,
        isOnline,
      }}
    >
      {children}
    </ShiftContext.Provider>
  );
}
```

### Step 4: Add Status Indicator

```javascript
// Add to your Dashboard or App component
function ConnectionStatus() {
  const { isOnline } = useShifts();

  return (
    <div className={`status-indicator ${isOnline ? "online" : "offline"}`}>
      {isOnline ? (
        <>🟢 SharePoint verbunden</>
      ) : (
        <>🟡 Offline-Modus (localStorage)</>
      )}
    </div>
  );
}
```

### Step 5: Test the Integration

1. **Development Mode**: Works with localStorage
2. **Stadtwerke Network**: Automatically connects to SharePoint
3. **Hybrid Mode**: Falls back gracefully if SharePoint unavailable

## 🔧 Configuration

### Update your app configuration:

```javascript
// src/config/environment.js
export const config = {
  sharePoint: {
    siteUrl: "https://stadtwerke-augsburg.sharepoint.com/sites/swaxi-dispo",
    enabled: true,
    fallbackToLocalStorage: true,
  },
  features: {
    realTimeUpdates: true,
    auditLogging: true,
    conflictDetection: true,
  },
};
```

## 📊 Benefits for Stadtwerke Augsburg

### Immediate Benefits:

- ✅ No additional licensing costs
- ✅ Uses existing IT infrastructure
- ✅ Integrates with Active Directory
- ✅ Follows municipal security standards
- ✅ Mobile access for field workers
- ✅ Automatic backups included

### Future Expansion:

- 📈 Add Power BI dashboards for management
- 🔄 Integrate with other municipal systems
- 📱 Create Power Apps for different departments
- 🤖 Add Power Automate workflows
- 📧 Email notifications for shift changes

## 🎯 Next Steps

1. **Send IT request email** (use template above)
2. **Test current app** (works offline already)
3. **Wait for SharePoint site creation** (usually 1-3 days)
4. **Create the lists** (30 minutes)
5. **Update app URL** in sharePointService.js
6. **Deploy and test** from Stadtwerke network

## 🔧 Technical Notes

### SharePoint REST API Endpoints:

```
Get Items: /_api/web/lists/getbytitle('ListName')/items
Create Item: /_api/web/lists/getbytitle('ListName')/items (POST)
Update Item: /_api/web/lists/getbytitle('ListName')/items(ID) (MERGE)
Delete Item: /_api/web/lists/getbytitle('ListName')/items(ID) (DELETE)
```

### Authentication:

- Uses Windows Authentication when on Stadtwerke network
- Falls back to localStorage for development
- No additional login required for users

This solution is perfect for Stadtwerke Augsburg because it leverages your existing Microsoft 365 infrastructure while providing a modern, user-friendly interface!
