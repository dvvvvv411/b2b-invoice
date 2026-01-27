
## Spedition-Felder aus Kaufvertrag entfernen

Die Spedition-Informationen (`spedition_unternehmen`, `spedition_strasse`, `spedition_plzstadt`) sollen nicht mehr an Docmosis gesendet werden.

### Betroffene Dateien

1. **`supabase/functions/generate-kaufvertrag-pdf/index.ts`**
2. **`supabase/functions/generate-kaufvertrag-docx/index.ts`**

### Änderungen

In beiden Dateien werden die folgenden drei Zeilen aus dem `jsonData`-Objekt entfernt:

**Zeilen 231-233:**
```typescript
spedition_unternehmen: spedition.name || '',
spedition_strasse: spedition.strasse || '',
spedition_plzstadt: spedition.plz_stadt || ''
```

### Technische Details

Die Spedition wird weiterhin aus der Datenbank geladen (da sie eventuell für andere Zwecke benötigt wird oder als Pflichtfeld im Request erwartet wird), aber die Daten werden einfach nicht mehr an Docmosis weitergegeben.

Das bedeutet:
- Die Platzhalter `<<spedition_unternehmen>>`, `<<spedition_strasse>>`, `<<spedition_plzstadt>>` im Docmosis-Template bleiben leer
- Falls das Template diese Platzhalter noch enthält, werden sie durch leere Strings ersetzt
- Optional kannst du die Platzhalter auch direkt aus dem Docmosis-Template entfernen

### Resultat

Nach der Änderung werden keine Spedition-Daten mehr im generierten Kaufvertrag erscheinen.
