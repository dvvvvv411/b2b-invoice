-- Neue Spalte für Geschlecht des Kontoinhabers hinzufügen
ALTER TABLE bankkonten 
ADD COLUMN kontoinhaber_geschlecht TEXT NOT NULL DEFAULT 'M' 
CHECK (kontoinhaber_geschlecht IN ('M', 'W'));

-- Bestehende Daten basierend auf Namensanalyse aktualisieren
-- Weibliche Konten
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Tina%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Geertje%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Rebecca%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Antonia%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Amy%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Patricia%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'W' WHERE kontoinhaber ILIKE '%Anna%';

-- Männliche Konten (bereits Default 'M', aber explizit zur Sicherheit)
UPDATE bankkonten SET kontoinhaber_geschlecht = 'M' WHERE kontoinhaber ILIKE '%Nenad%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'M' WHERE kontoinhaber ILIKE '%Andreas%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'M' WHERE kontoinhaber ILIKE '%Andre%';
UPDATE bankkonten SET kontoinhaber_geschlecht = 'M' WHERE kontoinhaber ILIKE '%Jean Pascal%';