-- Erstelle Tabelle für Anwaltskanzleien
CREATE TABLE public.anwaltskanzleien (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    strasse TEXT,
    plz TEXT,
    stadt TEXT,
    rechtsanwalt TEXT,
    telefon TEXT,
    fax TEXT,
    email TEXT,
    website TEXT,
    registergericht TEXT,
    register_nr TEXT,
    ust_id TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle Tabelle für insolvente Unternehmen
CREATE TABLE public.insolvente_unternehmen (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amtsgericht TEXT,
    aktenzeichen TEXT,
    handelsregister TEXT,
    adresse TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle Tabelle für Kunden
CREATE TABLE public.kunden (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    adresse TEXT,
    plz TEXT,
    stadt TEXT,
    geschaeftsfuehrer TEXT,
    aktenzeichen TEXT, -- Format: AZ/0305/XXX
    kundennummer TEXT, -- Format: XXX/0745/IN
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle Tabelle für Autos
CREATE TABLE public.autos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marke TEXT,
    modell TEXT,
    fahrgestell_nr TEXT,
    dekra_bericht_nr TEXT,
    erstzulassung DATE,
    kilometer INTEGER,
    einzelpreis_netto DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle Tabelle für Bankkonten
CREATE TABLE public.bankkonten (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kontoname TEXT,
    kontoinhaber TEXT,
    iban TEXT,
    bic TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Erstelle Tabelle für Speditionen
CREATE TABLE public.speditionen (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    strasse TEXT,
    plz TEXT,
    stadt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Aktiviere Row Level Security für alle Tabellen
ALTER TABLE public.anwaltskanzleien ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insolvente_unternehmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kunden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankkonten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speditionen ENABLE ROW LEVEL SECURITY;

-- RLS Policies für anwaltskanzleien
CREATE POLICY "Users can view their own anwaltskanzleien" 
ON public.anwaltskanzleien 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own anwaltskanzleien" 
ON public.anwaltskanzleien 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anwaltskanzleien" 
ON public.anwaltskanzleien 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anwaltskanzleien" 
ON public.anwaltskanzleien 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies für insolvente_unternehmen
CREATE POLICY "Users can view their own insolvente_unternehmen" 
ON public.insolvente_unternehmen 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insolvente_unternehmen" 
ON public.insolvente_unternehmen 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insolvente_unternehmen" 
ON public.insolvente_unternehmen 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insolvente_unternehmen" 
ON public.insolvente_unternehmen 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies für kunden
CREATE POLICY "Users can view their own kunden" 
ON public.kunden 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kunden" 
ON public.kunden 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kunden" 
ON public.kunden 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kunden" 
ON public.kunden 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies für autos
CREATE POLICY "Users can view their own autos" 
ON public.autos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own autos" 
ON public.autos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own autos" 
ON public.autos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own autos" 
ON public.autos 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies für bankkonten
CREATE POLICY "Users can view their own bankkonten" 
ON public.bankkonten 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bankkonten" 
ON public.bankkonten 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bankkonten" 
ON public.bankkonten 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bankkonten" 
ON public.bankkonten 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies für speditionen
CREATE POLICY "Users can view their own speditionen" 
ON public.speditionen 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own speditionen" 
ON public.speditionen 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speditionen" 
ON public.speditionen 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own speditionen" 
ON public.speditionen 
FOR DELETE 
USING (auth.uid() = user_id);

-- Erstelle Funktion für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger für automatische updated_at Aktualisierung
CREATE TRIGGER update_anwaltskanzleien_updated_at
    BEFORE UPDATE ON public.anwaltskanzleien
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insolvente_unternehmen_updated_at
    BEFORE UPDATE ON public.insolvente_unternehmen
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kunden_updated_at
    BEFORE UPDATE ON public.kunden
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_autos_updated_at
    BEFORE UPDATE ON public.autos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bankkonten_updated_at
    BEFORE UPDATE ON public.bankkonten
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_speditionen_updated_at
    BEFORE UPDATE ON public.speditionen
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();