-- Remove aktenzeichen and kundennummer columns from kunden table
ALTER TABLE public.kunden 
DROP COLUMN aktenzeichen,
DROP COLUMN kundennummer;