-- Create enum for template types
CREATE TYPE template_type AS ENUM ('rechnung', 'angebot', 'mahnung', 'sonstiges');

-- Create rechnungsnummern table for invoice number tracking
CREATE TABLE public.rechnungsnummern (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  letzte_nummer integer NOT NULL DEFAULT 23975,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on rechnungsnummern
ALTER TABLE public.rechnungsnummern ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rechnungsnummern
CREATE POLICY "Users can view own invoice numbers"
  ON public.rechnungsnummern FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own invoice numbers"
  ON public.rechnungsnummern FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoice numbers"
  ON public.rechnungsnummern FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for rechnungsnummern updated_at
CREATE TRIGGER update_rechnungsnummern_updated_at
  BEFORE UPDATE ON public.rechnungsnummern
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create document_templates table
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  template_type template_type NOT NULL DEFAULT 'rechnung',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on document_templates
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Users can view own templates"
  ON public.document_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON public.document_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON public.document_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON public.document_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for document_templates updated_at
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for document templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-templates', 'document-templates', false);

-- RLS Policies for storage bucket
CREATE POLICY "Users can upload own templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own templates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-templates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);