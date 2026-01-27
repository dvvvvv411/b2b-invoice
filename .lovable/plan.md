
## Dokumente Erstellen - Seite verkleinern

Die Seite `/admin/dokumente-erstellen` wird für kleinere Bildschirme optimiert, indem alle Abstände, Schriftgrößen und Komponenten verkleinert werden.

### Übersicht der Änderungen

| Element | Vorher | Nachher |
|---------|--------|---------|
| Haupt-Padding | `p-6` | `p-3` |
| Abstände zwischen Sektionen | `space-y-6` | `space-y-3` |
| Header-Titel | `text-3xl` | `text-xl` |
| Icon-Container | `p-3`, `w-6 h-6` | `p-2`, `w-5 h-5` |
| Card-Header/Content | Standard | Kompakter mit weniger Padding |
| DEKRA-Input | `h-16`, `text-2xl` | `h-10`, `text-lg` |
| Fahrzeug-Tabelle | Standard Höhe | Reduzierte ScrollArea-Höhe |
| Zusammenfassung-Cards | Große Schrift | Kompaktere Darstellung |

### Betroffene Datei

**`src/pages/admin/DokumenteErstellen.tsx`**

### Technische Details

1. **Container-Padding reduzieren**:
   - Zeile 662: `p-6 space-y-6` → `p-3 space-y-3 lg:p-6 lg:space-y-6`

2. **Header verkleinern**:
   - Titel: `text-3xl` → `text-xl lg:text-3xl`
   - Icon-Container: `p-3` → `p-2`, Icon: `w-6 h-6` → `w-5 h-5`

3. **Card-Komponenten kompakter machen**:
   - CardHeader/CardContent mit weniger Padding
   - Grid-Gaps von `gap-4` auf `gap-3` reduzieren

4. **DEKRA-Eingabefeld verkleinern**:
   - Von `h-16 text-2xl` auf `h-10 text-lg`

5. **ScrollArea für Fahrzeugliste**:
   - Höhe von `h-64` auf `h-40` reduzieren

6. **Responsives Design**:
   - Verwendet `lg:` Prefixes für größere Bildschirme
   - Kleinere Standardwerte für mobile/kleine Bildschirme

### Resultat

Nach der Änderung passt die Seite besser auf kleinere Bildschirme. Auf größeren Bildschirmen (lg und größer) wird die ursprüngliche Größe beibehalten.
