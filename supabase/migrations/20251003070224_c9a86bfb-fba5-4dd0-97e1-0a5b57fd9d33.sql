-- Add new combined plz_stadt column
ALTER TABLE public.speditionen ADD COLUMN plz_stadt text;

-- Migrate existing data
UPDATE public.speditionen 
SET plz_stadt = CONCAT(COALESCE(plz, ''), ' ', COALESCE(stadt, ''))
WHERE plz IS NOT NULL OR stadt IS NOT NULL;

-- For entries where both are null, set to empty string
UPDATE public.speditionen 
SET plz_stadt = ''
WHERE plz_stadt IS NULL;

-- Drop old columns
ALTER TABLE public.speditionen DROP COLUMN plz;
ALTER TABLE public.speditionen DROP COLUMN stadt;