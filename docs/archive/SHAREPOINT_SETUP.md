# (ARCHIVED) SharePoint Setup Guide

> Archiviert: SharePoint Integration ist aktuell via Feature Flag deaktiviert (`VITE_ENABLE_SHAREPOINT=false`). Architektur (Service + Repository) bleibt erhalten und kann ohne Refactor reaktiviert werden.

Aktueller Betriebsmodus: In-Memory oder IndexedDB.

Re-Aktivierung Schritte:

1. `.env` anlegen (siehe `.env.example`)
2. `VITE_ENABLE_SHAREPOINT=true` und `VITE_SHIFT_BACKEND=sharepoint` setzen
3. Dev-Server neu starten
4. ConnectionStatus / Repository nutzen dann SharePoint Routen

Fallback Verhalten: Ist das Flag `false`, erzwingt `repositoryFactory` eine automatische Rückfall-Logik und nutzt IndexedDB auch wenn `VITE_SHIFT_BACKEND=sharepoint` gesetzt wurde.

---
Gekürzte Original-Notizen (vollständige Version in Git Historie):

- Listen: Shifts, Users, Applications, AuditLog
- REST Basis: `/_api/web/lists/getbytitle('ListName')/items`
- Auth: Intranet / MS365 Session (delegated) – später ggf. Service Principal
