
## Toast-Spam Bug Fix

### Problem
Wenn eine Bestellung zum Generator gesendet wird, erscheint die Toast-Benachrichtigung "Fahrzeug(e) zugewiesen" in einer Endlosschleife. Dies liegt an einem fehlerhaften `useEffect` in der Datei `DokumenteErstellen.tsx`.

### Ursache
Der `useEffect` (Zeilen 148-209) wird wiederholt ausgeführt weil:
1. `toast` ist unnötigerweise in den Dependencies
2. `kanzleien`, `speditionen`, `insolventeUnternehmen` ändern sich bei jedem Query-Refetch
3. Es gibt keinen Schutz gegen mehrfaches Ausführen

### Lösung
Ein `useRef` wird verwendet um zu tracken, ob die Bestellung bereits verarbeitet wurde. Der Effect wird nur einmal pro `bestellungId` ausgeführt.

### Änderungen

**Datei:** `src/pages/admin/DokumenteErstellen.tsx`

1. **Neuen Ref hinzufügen** (nach den anderen State-Definitionen, ca. Zeile 66):
```typescript
const processedBestellungRef = useRef<string | null>(null);
```

2. **Import erweitern** (Zeile 1):
```typescript
import { useState, useEffect, useRef } from 'react';
```

3. **useEffect anpassen** (Zeilen 148-209):
   - Guard hinzufügen: Wenn `bestellungId` bereits verarbeitet wurde, abbrechen
   - Nach erfolgreicher Verarbeitung: Ref auf aktuelle `bestellungId` setzen
   - Dependencies reduzieren auf nur die notwendigen: `bestellungId`, `bestellungen`, `autos`
   - `toast`, `kanzleien`, `speditionen`, `insolventeUnternehmen` aus Dependencies entfernen

### Technische Details

```text
┌─────────────────────────────────────────────────────────────┐
│  VORHER (Bug)                                               │
├─────────────────────────────────────────────────────────────┤
│  useEffect mit Dependencies:                                │
│  - bestellungId                                             │
│  - bestellungen                                             │
│  - autos                                                    │
│  - kanzleien        ← Löst Re-Run aus                       │
│  - speditionen      ← Löst Re-Run aus                       │
│  - insolventeUnternehmen ← Löst Re-Run aus                  │
│  - toast            ← Löst Re-Run aus                       │
│                                                             │
│  → Toast wird bei jeder Änderung erneut angezeigt!          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  NACHHER (Fix)                                              │
├─────────────────────────────────────────────────────────────┤
│  useEffect mit:                                             │
│  - Guard: if (processedBestellungRef.current === id) return │
│  - Dependencies: [bestellungId, bestellungen, autos]        │
│  - Nach Erfolg: processedBestellungRef.current = id         │
│                                                             │
│  → Toast wird nur EINMAL pro Bestellung angezeigt!          │
└─────────────────────────────────────────────────────────────┘
```

### Resultat
Nach der Änderung wird die Toast-Benachrichtigung nur noch einmal angezeigt, wenn eine Bestellung zum Generator weitergeleitet wird.
