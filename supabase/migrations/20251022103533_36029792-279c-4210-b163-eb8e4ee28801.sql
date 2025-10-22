-- Bestellungen Tabelle erstellen
CREATE TABLE IF NOT EXISTS public.bestellungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    kunde_id UUID NOT NULL REFERENCES public.kunden(id) ON DELETE CASCADE,
    kunde_typ TEXT NOT NULL CHECK (kunde_typ IN ('privat', 'unternehmen')),
    dekra_nummern TEXT[] NOT NULL DEFAULT '{}',
    rabatt_prozent NUMERIC(5,2) DEFAULT NULL,
    rabatt_aktiv BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.bestellungen ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bestellungen"
    ON public.bestellungen FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bestellungen"
    ON public.bestellungen FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bestellungen"
    ON public.bestellungen FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bestellungen"
    ON public.bestellungen FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE TRIGGER update_bestellungen_updated_at
    BEFORE UPDATE ON public.bestellungen
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes für Performance
CREATE INDEX idx_bestellungen_user_id ON public.bestellungen(user_id);
CREATE INDEX idx_bestellungen_kunde_id ON public.bestellungen(kunde_id);