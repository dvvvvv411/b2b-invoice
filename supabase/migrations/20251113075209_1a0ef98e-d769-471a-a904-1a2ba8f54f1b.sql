-- Add insolventes_unternehmen_id column to speditionen table
ALTER TABLE speditionen 
ADD COLUMN insolventes_unternehmen_id uuid REFERENCES insolvente_unternehmen(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_speditionen_insolventes_unternehmen 
ON speditionen(insolventes_unternehmen_id);

-- Add comment
COMMENT ON COLUMN speditionen.insolventes_unternehmen_id IS 
'Optionale Verknüpfung zu einem insolventen Unternehmen für automatische Speditionsauswahl';

-- Add unique constraint for IBAN per user on bankkonten table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_iban_per_user'
    ) THEN
        ALTER TABLE bankkonten 
        ADD CONSTRAINT unique_iban_per_user UNIQUE (user_id, iban);
    END IF;
END $$;