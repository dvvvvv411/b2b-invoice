
# Datenbereinigung - Löschplan

## Übersicht der Löschaktionen

| Tabelle | Aktion | Verbleibende Einträge |
|---------|--------|----------------------|
| Bestellungen | ALLE löschen | 0 |
| Kanzleien | 4 von 5 löschen | 1 (LEGATI) |
| Speditionen | 7 von 8 löschen | 1 (Ripac Transport GmbH) |
| Bankkonten | ALLE löschen | 0 |
| Insolvente Unternehmen | 7 von 8 löschen | 1 (Noris Management GmbH) |

## SQL-Befehle (werden ausgeführt)

### 1. Alle Bestellungen löschen
```sql
DELETE FROM bestellungen;
```

### 2. Kanzleien löschen (außer LEGATI)
```sql
DELETE FROM anwaltskanzleien 
WHERE name != 'LEGATI Rechtsanwalt - Steuerberater - Wirtschaftsprüfer Polat und Weismann Partnerschaft';
```

### 3. Speditionen löschen (außer Ripac Transport GmbH)
```sql
DELETE FROM speditionen 
WHERE name != 'Ripac Transport GmbH';
```

### 4. Alle Bankkonten löschen
```sql
DELETE FROM bankkonten;
```

### 5. Insolvente Unternehmen löschen (außer Noris Management GmbH)
```sql
DELETE FROM insolvente_unternehmen 
WHERE name != 'Noris Management GmbH';
```

## Wichtige Hinweise

- Diese Löschungen sind **unwiderruflich**
- Bestellungen werden komplett gelöscht (alle ~50+ Einträge)
- Alle Bankkonten werden gelöscht (~43 Einträge)
- Die jeweils zu behaltenden Einträge (LEGATI, Ripac Transport, Noris Management) bleiben erhalten

## Technische Details

Die Löschungen werden über das Supabase Insert-Tool ausgeführt, da dieses Tool für DELETE-Operationen verwendet werden muss (nicht die Migration).

Nach der Ausführung werden die Query-Caches invalidiert, sodass die UI automatisch aktualisiert wird.
