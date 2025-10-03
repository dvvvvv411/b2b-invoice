-- Add is_default column to insolvente_unternehmen
ALTER TABLE public.insolvente_unternehmen ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Add is_default column to speditionen
ALTER TABLE public.speditionen ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Add is_default column to anwaltskanzleien
ALTER TABLE public.anwaltskanzleien ADD COLUMN is_default BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_insolvente_unternehmen_user_default ON public.insolvente_unternehmen(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_speditionen_user_default ON public.speditionen(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_anwaltskanzleien_user_default ON public.anwaltskanzleien(user_id, is_default) WHERE is_default = true;

-- Function to ensure only one default per user for insolvente_unternehmen
CREATE OR REPLACE FUNCTION public.ensure_single_default_insolvente_unternehmen()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.insolvente_unternehmen 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for insolvente_unternehmen
CREATE TRIGGER trigger_single_default_insolvente_unternehmen
  BEFORE INSERT OR UPDATE ON public.insolvente_unternehmen
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_insolvente_unternehmen();

-- Function to ensure only one default per user for speditionen
CREATE OR REPLACE FUNCTION public.ensure_single_default_speditionen()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.speditionen 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for speditionen
CREATE TRIGGER trigger_single_default_speditionen
  BEFORE INSERT OR UPDATE ON public.speditionen
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_speditionen();

-- Function to ensure only one default per user for anwaltskanzleien
CREATE OR REPLACE FUNCTION public.ensure_single_default_anwaltskanzleien()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.anwaltskanzleien 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for anwaltskanzleien
CREATE TRIGGER trigger_single_default_anwaltskanzleien
  BEFORE INSERT OR UPDATE ON public.anwaltskanzleien
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_anwaltskanzleien();