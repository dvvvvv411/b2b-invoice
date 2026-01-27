-- Datenbereinigung: Lösche alle nicht benötigten Einträge

-- 1. Alle Bestellungen löschen
DELETE FROM bestellungen;

-- 2. Kanzleien löschen (außer LEGATI)
DELETE FROM anwaltskanzleien 
WHERE name != 'LEGATI Rechtsanwalt - Steuerberater - Wirtschaftsprüfer Polat und Weismann Partnerschaft';

-- 3. Speditionen löschen (außer Ripac Transport GmbH)
DELETE FROM speditionen 
WHERE name != 'Ripac Transport GmbH';

-- 4. Alle Bankkonten löschen
DELETE FROM bankkonten;

-- 5. Insolvente Unternehmen löschen (außer Noris Management GmbH)
DELETE FROM insolvente_unternehmen 
WHERE name != 'Noris Management GmbH';