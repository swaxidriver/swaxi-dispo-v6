# Statusmodell

P0-5 definiert ein einfaches, deterministisches Statusmodell für Schichten.

## Stati

| Status      | Bedeutung                | Notizen                |
| ----------- | ------------------------ | ---------------------- |
| `open`      | Buchbar / Bewerbungen ok | Initialzustand         |
| `assigned`  | Zuweisung erfolgt        | Keine Bewerbungen mehr |
| `cancelled` | Abgesagt                 | Terminal               |

## Erlaubte Transitionen

```text
open -> assigned
open -> cancelled
assigned -> cancelled
```

Gleicher Status (`open -> open`) ist ein No-op und erlaubt.

## Verbotene Transitionen

- `assigned -> open`
- `cancelled -> open`
- `cancelled -> assigned`

## Implementierung

Datei: `src/domain/status.js`

Exports:

- `STATUS` Enum
- `canTransition(from, to)` (boolean)
- `assertTransition(from, to)` (wirft Fehler bei ungültigem Wechsel)

## Verwendung im Code

`ShiftContext.assignShift` ruft `assertTransition` vor Statusänderung.

Implementierte Erweiterungen (Stand jetzt):

- Dedizierte `cancelShift` Aktion im `ShiftContext` mit Guard
- UI Buttons (Bewerben / Zuweisen / Absagen) deaktivieren Aktionen falls `!canTransition` oder Benutzer nicht eingeloggt; Tooltip liefert Grund
- Konflikte werden nach jeder Statusänderung neu berechnet

Siehe README Abschnitt "Konflikt-Logik" für Details zu Konfliktcodes.

## Tests

Siehe `src/tests/statusModel.test.js` (positive & negative Pfade) und `shiftDomainGuards.test.jsx` (Duplicate Prevent + Kontextintegration).
